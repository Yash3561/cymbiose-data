import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET chunks for data explorer
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const sortBy = searchParams.get('sortBy') || 'createdAt';
        const sortDir = searchParams.get('sortDir') || 'desc';

        const skip = (page - 1) * pageSize;

        const [chunks, totalCount] = await Promise.all([
            prisma.kBChunk.findMany({
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortDir },
                include: {
                    kbEntry: {
                        select: { kbId: true, title: true }
                    }
                }
            }),
            prisma.kBChunk.count()
        ]);

        // Define columns for the table
        const columns = [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'entryKbId', label: 'Entry KB ID', type: 'string' },
            { key: 'entryTitle', label: 'Entry Title', type: 'string' },
            { key: 'chunkIndex', label: 'Chunk #', type: 'number' },
            { key: 'tokenCount', label: 'Tokens', type: 'number' },
            { key: 'content', label: 'Content', type: 'string' },
            { key: 'createdAt', label: 'Created', type: 'date' },
        ];

        // Map chunks to include entry info
        const rows = chunks.map(chunk => ({
            id: chunk.id,
            entryKbId: chunk.kbEntry?.kbId || '—',
            entryTitle: chunk.kbEntry?.title || '—',
            chunkIndex: chunk.chunkIndex,
            tokenCount: chunk.tokenCount,
            content: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : ''),
            createdAt: chunk.createdAt,
        }));

        return NextResponse.json({
            columns,
            rows,
            totalCount
        });
    } catch (error) {
        console.error('Data explorer chunks error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
