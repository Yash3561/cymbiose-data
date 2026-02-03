import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET all KB entries
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const sourceType = searchParams.get('sourceType');
        const ragStatus = searchParams.get('ragStatus');
        const search = searchParams.get('search');
        const minQuality = searchParams.get('minQuality');

        const where: Record<string, unknown> = {};

        if (sourceType) {
            where.sourceType = sourceType;
        }

        if (ragStatus) {
            where.ragInclusionStatus = ragStatus;
        }

        if (minQuality) {
            where.sourceQualityScore = { gte: parseInt(minQuality) };
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { summary: { contains: search, mode: 'insensitive' } },
                { kbId: { contains: search, mode: 'insensitive' } }
            ];
        }

        const entries = await prisma.kBEntry.findMany({
            where,
            orderBy: { dateAdded: 'desc' },
            include: {
                _count: {
                    select: { chunks: true }
                }
            }
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error('Error fetching KB entries:', error);
        return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
    }
}

// POST create new KB entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Check for duplicate URL
        if (body.urlOrLocation) {
            const existing = await prisma.kBEntry.findFirst({
                where: { urlOrLocation: body.urlOrLocation }
            });

            if (existing) {
                return NextResponse.json({
                    error: 'Duplicate URL',
                    message: `This URL already exists in the KB as "${existing.title}"`,
                    existingId: existing.kbId
                }, { status: 409 });
            }
        }

        const entry = await prisma.kBEntry.create({
            data: {
                kbId: body.kbId,
                sourceType: body.sourceType,
                sourceCategory: body.sourceCategory || 'CYMBIOSE_IP',
                title: body.title,
                authorOrganization: body.authorOrganization,
                year: body.year ? parseInt(body.year) : null,
                urlOrLocation: body.urlOrLocation,
                accessType: body.accessType || 'INTERNAL',
                license: body.license,
                peerReviewed: body.peerReviewed || false,
                sourceQualityScore: body.sourceQualityScore ? parseInt(body.sourceQualityScore) : null,
                summary: body.summary,
                keyFindings: body.keyFindings,
                evidenceLevel: body.evidenceLevel || null,
                rawContent: body.rawContent,
                tagsModality: body.tagsModality || [],
                tagsCulturalContext: body.tagsCulturalContext || [],
                tagsRiskLanguage: body.tagsRiskLanguage || [],
                tagsPopulation: body.tagsPopulation || [],
                tagsDocumentationStyle: body.tagsDocumentationStyle || [],
                tagsInterventionCategory: body.tagsInterventionCategory || [],
                tagsBiasType: body.tagsBiasType || [],
                tagsSupervision: body.tagsSupervision || false,
                geography: body.geography,
                language: body.language || 'English',
                controlledVocabTerms: body.controlledVocabTerms || [],
                ragInclusionStatus: body.ragInclusionStatus || 'PENDING',
                chunkingNotes: body.chunkingNotes,
                chunkingStrategy: body.chunkingStrategy || null,
                deIdentificationStatus: body.deIdentificationStatus || 'NA',
                ipRightsStatus: body.ipRightsStatus || 'PENDING',
                hipaaCompliant: body.hipaaCompliant || false,
                addedBy: body.addedBy || 'System',
                notes: body.notes
            }
        });

        // Create chunks if provided
        if (body.chunks && Array.isArray(body.chunks) && body.chunks.length > 0) {
            await prisma.kBChunk.createMany({
                data: body.chunks.map((chunk: { content: string; tokenCount?: number; chunkIndex: number }) => ({
                    kbEntryId: entry.id,
                    content: chunk.content,
                    tokenCount: chunk.tokenCount || Math.ceil(chunk.content.length / 4),
                    chunkIndex: chunk.chunkIndex
                }))
            });
            console.log(`✅ Created ${body.chunks.length} chunks for entry ${entry.kbId}`);
        }

        // --------------------------------------------------------------------------------
        // 1. Create Audit Log
        // --------------------------------------------------------------------------------
        try {
            await prisma.auditLog.create({
                data: {
                    kbEntryId: entry.id,
                    action: 'CREATE',
                    performedBy: body.addedBy || 'System',
                    newValue: JSON.stringify({ title: entry.title, url: entry.urlOrLocation }),
                    performedAt: new Date()
                }
            });
        } catch (auditError) {
            console.error('Failed to create audit log:', auditError);
        }

        // --------------------------------------------------------------------------------
        // 2. Register/Update Data Source
        // --------------------------------------------------------------------------------
        if (entry.urlOrLocation) {
            try {
                // Extract domain as source name (simplistic approach)
                const urlObj = new URL(entry.urlOrLocation);
                const domain = urlObj.hostname.replace('www.', '');

                await prisma.dataSource.upsert({
                    where: { name: domain },
                    update: {
                        lastSyncAt: new Date(),
                        totalEntries: { increment: 1 }
                    },
                    create: {
                        name: domain,
                        category: (entry.sourceCategory as any) || 'MEDIA_LITERATURE',
                        baseUrl: urlObj.origin,
                        isActive: true,
                        lastSyncAt: new Date(),
                        totalEntries: 1
                    }
                });
            } catch (dsError) {
                console.error('Failed to register data source:', dsError);
            }
        }

        return NextResponse.json(entry, { status: 201 });
    } catch (error) {
        console.error('Error creating KB entry:', error);
        return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }
}
