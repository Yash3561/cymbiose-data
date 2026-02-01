import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET chunks for a specific entry
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const chunks = await prisma.kBChunk.findMany({
            where: { entryId: id },
            orderBy: { chunkIndex: 'asc' },
            select: {
                id: true,
                chunkIndex: true,
                content: true,
                tokenCount: true
            }
        });

        return NextResponse.json(chunks);
    } catch (error) {
        console.error('Error fetching chunks:', error);
        return NextResponse.json({ error: 'Failed to fetch chunks' }, { status: 500 });
    }
}
