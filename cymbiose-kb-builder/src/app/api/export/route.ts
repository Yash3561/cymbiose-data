import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Export KB entries in various formats
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const format = searchParams.get('format') || 'json';
        const ragStatus = searchParams.get('ragStatus') || 'APPROVED';

        const entries = await prisma.kBEntry.findMany({
            where: {
                ragInclusionStatus: ragStatus as 'APPROVED' | 'PENDING' | 'EXCLUDED' | 'REVIEW_NEEDED'
            },
            include: {
                chunks: true
            }
        });

        // JSONL format - one JSON object per line (for fine-tuning)
        if (format === 'jsonl') {
            const lines = entries.map(entry => JSON.stringify({
                instruction: "Provide information about this clinical topic based on the following source.",
                input: entry.title,
                output: entry.summary || entry.rawContent?.substring(0, 1000) || '',
                metadata: {
                    kbId: entry.kbId,
                    modality: entry.tagsModality,
                    population: entry.tagsPopulation,
                    source: entry.urlOrLocation
                }
            }));

            return new NextResponse(lines.join('\n'), {
                headers: {
                    'Content-Type': 'application/x-jsonlines',
                    'Content-Disposition': `attachment; filename="cymbiose-kb-${new Date().toISOString().split('T')[0]}.jsonl"`
                }
            });
        }

        // CSV format
        if (format === 'csv') {
            const headers = ['kbId', 'title', 'sourceType', 'author', 'year', 'url', 'summary', 'modality', 'population', 'ragStatus', 'chunkCount'];
            const escapeCSV = (val: string | null | undefined) => {
                if (!val) return '';
                return `"${String(val).replace(/"/g, '""')}"`;
            };

            const rows = entries.map(entry => [
                entry.kbId,
                escapeCSV(entry.title),
                entry.sourceType,
                escapeCSV(entry.authorOrganization),
                entry.year || '',
                escapeCSV(entry.urlOrLocation),
                escapeCSV(entry.summary?.substring(0, 200)),
                entry.tagsModality?.join('; ') || '',
                entry.tagsPopulation?.join('; ') || '',
                entry.ragInclusionStatus,
                entry.chunks.length
            ].join(','));

            const csv = [headers.join(','), ...rows].join('\n');

            return new NextResponse(csv, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="cymbiose-kb-${new Date().toISOString().split('T')[0]}.csv"`
                }
            });
        }

        // Chunks format - JSONL for vector embedding (one chunk per line)
        if (format === 'chunks') {
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

            // Return as JSONL (one JSON object per line)
            const jsonl = chunks.map(chunk => JSON.stringify(chunk)).join('\n');

            return new NextResponse(jsonl, {
                headers: {
                    'Content-Type': 'application/x-jsonlines',
                    'Content-Disposition': `attachment; filename="cymbiose-chunks-${new Date().toISOString().split('T')[0]}.jsonl"`
                }
            });
        }

        // Default: Full JSON export
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
            qualityScore: entry.sourceQualityScore,
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
