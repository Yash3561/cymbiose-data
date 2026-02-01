import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET KB statistics for dashboard
export async function GET() {
    try {
        // Count by source type
        const sourceTypeCounts = await prisma.kBEntry.groupBy({
            by: ['sourceType'],
            _count: { id: true }
        });

        // Count by RAG status
        const ragStatusCounts = await prisma.kBEntry.groupBy({
            by: ['ragInclusionStatus'],
            _count: { id: true }
        });

        // Total entries and chunks
        const totalEntries = await prisma.kBEntry.count();
        const totalChunks = await prisma.kBChunk.count();

        // Recent entries
        const recentEntries = await prisma.kBEntry.findMany({
            take: 5,
            orderBy: { dateAdded: 'desc' },
            select: {
                id: true,
                kbId: true,
                title: true,
                sourceType: true,
                ragInclusionStatus: true,
                dateAdded: true
            }
        });

        // Tag coverage
        const entriesWithModality = await prisma.kBEntry.count({
            where: { tagsModality: { isEmpty: false } }
        });

        const entriesWithCultural = await prisma.kBEntry.count({
            where: { tagsCulturalContext: { isEmpty: false } }
        });

        // Quality score distribution
        const qualityDistribution = await prisma.kBEntry.groupBy({
            by: ['sourceQualityScore'],
            _count: { id: true },
            where: { sourceQualityScore: { not: null } }
        });

        // Average quality score
        const avgQuality = await prisma.kBEntry.aggregate({
            _avg: { sourceQualityScore: true },
            where: { sourceQualityScore: { not: null } }
        });

        return NextResponse.json({
            totalEntries,
            totalChunks,
            sourceTypes: sourceTypeCounts.map(s => ({
                type: s.sourceType,
                count: s._count.id
            })),
            ragStatuses: ragStatusCounts.map(r => ({
                status: r.ragInclusionStatus,
                count: r._count.id
            })),
            tagCoverage: {
                withModality: entriesWithModality,
                withCultural: entriesWithCultural,
                total: totalEntries
            },
            qualityStats: {
                distribution: qualityDistribution.map(q => ({
                    score: q.sourceQualityScore,
                    count: q._count.id
                })),
                average: avgQuality._avg.sourceQualityScore || 0
            },
            recentEntries
        });

    } catch (error) {
        console.error('Stats error:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
