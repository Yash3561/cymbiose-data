import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Export KB entries as JSON for vector embedding
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'full';
        const ragStatus = searchParams.get('ragStatus') || 'APPROVED';

        const entries = await prisma.kBEntry.findMany({
            where: {
                ragInclusionStatus: ragStatus as 'APPROVED' | 'PENDING' | 'EXCLUDED' | 'REVIEW_NEEDED'
            },
            include: {
                chunks: true
            }
        });

        if (format === 'chunks') {
            // Export as individual chunks for vector embedding
            const chunks = entries.flatMap(entry =>
                entry.chunks.map(chunk => ({
                    id: chunk.id,
                    kbEntryId: entry.kbId,
                    sourceType: entry.sourceType,
                    title: entry.title,
                    chunkIndex: chunk.chunkIndex,
                    content: chunk.content,
                    tokenCount: chunk.tokenCount,
                    metadata: {
                        modality: entry.tagsModality,
                        cultural: entry.tagsCulturalContext,
                        population: entry.tagsPopulation,
                        interventions: entry.tagsInterventionCategory
                    }
                }))
            );

            return NextResponse.json({
                totalEntries: entries.length,
                totalChunks: chunks.length,
                exportDate: new Date().toISOString(),
                chunks
            });
        }

        // Full export with all metadata
        const exportData = entries.map(entry => ({
            kbId: entry.kbId,
            sourceType: entry.sourceType,
            title: entry.title,
            author: entry.authorOrganization,
            year: entry.year,
            url: entry.urlOrLocation,
            summary: entry.summary,
            keyFindings: entry.keyFindings,
            rawContent: entry.rawContent,
            tags: {
                modality: entry.tagsModality,
                culturalContext: entry.tagsCulturalContext,
                riskLanguage: entry.tagsRiskLanguage,
                population: entry.tagsPopulation,
                documentationStyle: entry.tagsDocumentationStyle,
                interventionCategory: entry.tagsInterventionCategory,
                supervision: entry.tagsSupervision
            },
            controlledVocab: entry.controlledVocabTerms,
            ragStatus: entry.ragInclusionStatus,
            chunkCount: entry.chunks.length,
            addedBy: entry.addedBy,
            dateAdded: entry.dateAdded
        }));

        return NextResponse.json({
            totalEntries: exportData.length,
            exportDate: new Date().toISOString(),
            entries: exportData
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Failed to export KB' }, { status: 500 });
    }
}
