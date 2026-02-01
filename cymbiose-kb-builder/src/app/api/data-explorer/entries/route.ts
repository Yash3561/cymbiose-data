import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET entries for data explorer
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '25');
        const sortBy = searchParams.get('sortBy') || 'dateAdded';
        const sortDir = searchParams.get('sortDir') || 'desc';

        const skip = (page - 1) * pageSize;

        const [entries, totalCount] = await Promise.all([
            prisma.kBEntry.findMany({
                skip,
                take: pageSize,
                orderBy: { [sortBy]: sortDir },
                include: {
                    _count: { select: { chunks: true } }
                }
            }),
            prisma.kBEntry.count()
        ]);

        // Define columns for the table
        const columns = [
            { key: 'id', label: 'ID', type: 'string' },
            { key: 'kbId', label: 'KB ID', type: 'string' },
            { key: 'title', label: 'Title', type: 'string' },
            { key: 'sourceType', label: 'Source Type', type: 'string' },
            { key: 'urlOrLocation', label: 'Source URL', type: 'string' },
            { key: 'authorOrganization', label: 'Author/Org', type: 'string' },
            { key: 'sourceQualityScore', label: 'Quality', type: 'number' },
            { key: 'ragInclusionStatus', label: 'Status', type: 'string' },
            { key: 'tagsModality', label: 'Modality Tags', type: 'json' },
            { key: 'tagsCulturalContext', label: 'Cultural Tags', type: 'json' },
            { key: 'chunkCount', label: 'Chunks', type: 'number' },
            { key: 'dateAdded', label: 'Date Added', type: 'date' },
            { key: 'lastUpdated', label: 'Last Updated', type: 'date' },
        ];

        // Map entries to include chunk count
        const rows = entries.map(entry => ({
            ...entry,
            chunkCount: entry._count.chunks,
        }));

        return NextResponse.json({
            columns,
            rows,
            totalCount
        });
    } catch (error) {
        console.error('Data explorer entries error:', error);
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}
