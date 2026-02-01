// Seed file for Cymbiose KB Builder
// Seeds database with Brandi's example entries from the KB catalog

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Cymbiose KB Builder database...\n');

    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.kBChunk.deleteMany();
    await prisma.kBEntry.deleteMany();
    await prisma.dataSource.deleteMany();

    // ============================================================================
    // SEED DATA SOURCES (from architecture diagram)
    // ============================================================================
    console.log('📚 Creating data sources...');

    const dataSources = await prisma.dataSource.createMany({
        data: [
            {
                name: 'Cymbiose IP',
                category: 'CYMBIOSE_IP',
                description: 'Blogs, Webinars, Supervision playbooks, Internal bias and culture prompts',
                isActive: true
            },
            {
                name: 'Affirm CE Partner',
                category: 'CE_PARTNERS',
                description: 'Licenses and course catalogs, Course tags and outcomes',
                isActive: true
            },
            {
                name: 'Media and Literature',
                category: 'MEDIA_LITERATURE',
                description: 'Peer-reviewed articles, Clinical handbooks, Mental health blogs, Podcasts',
                isActive: true
            },
            {
                name: 'Culture & Diagnosis Research',
                category: 'CULTURE_DIAGNOSIS',
                description: 'Mental health across cultures, Structural factors, Racism in documentation',
                isActive: true
            },
            {
                name: 'Bias Detection & Ethics',
                category: 'BIAS_DETECTION',
                description: 'Bias mitigation algorithms, Bias taxonomy and rules, Ethical safeguards',
                isActive: true
            },
            {
                name: 'AWS Marketplace Datasets',
                category: 'CURATED_DATASETS',
                description: 'De-identified clinical data, Predictive models, Clinical data extraction',
                isActive: false
            }
        ]
    });
    console.log(`✅ Created ${dataSources.count} data sources\n`);

    // ============================================================================
    // SEED KB ENTRIES (from Brandi's examples)
    // ============================================================================
    console.log('📖 Creating KB entries...');

    // LIT_0001 - Healing Bias book
    const lit0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'LIT_0001',
            sourceType: 'LITERATURE',
            sourceCategory: 'BIAS_DETECTION',
            title: 'Healing Bias',
            authorOrganization: 'Dr D Crawford',
            accessType: 'INTERNAL',
            license: 'To confirm',
            summary: 'Book that lists 20 bias types with strategies for mitigation',
            keyFindings: 'Useful taxonomy for bias detection and training prompts',
            evidenceLevel: 'EXPERT_OPINION',
            tagsBiasType: ['cognitive bias', 'implicit bias', 'confirmation bias', 'anchoring bias'],
            tagsSupervision: true,
            tagsInterventionCategory: ['Bias mitigation'],
            language: 'English',
            controlledVocabTerms: ['bias_type', 'taxonomy'],
            ragInclusionStatus: 'PENDING',
            chunkingNotes: 'Create JSON snippets by bias type',
            chunkingStrategy: 'SEMANTIC',
            deIdentificationStatus: 'NA',
            ipRightsStatus: 'PERMISSION_REQUIRED',
            addedBy: 'Brandi',
            referenceFormat: 'APA',
            notes: 'Potential cornerstone for bias detection prompts'
        }
    });

    // BLOG_0001 - Cymbiose cultural considerations
    const blog0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'BLOG_0001',
            sourceType: 'BLOG',
            sourceCategory: 'CYMBIOSE_IP',
            title: 'Cymbiose cultural considerations series',
            authorOrganization: 'Cymbiose AI',
            accessType: 'INTERNAL',
            license: 'Cymbiose IP',
            summary: 'Internal blog posts that explain cultural context patterns for documentation',
            keyFindings: 'High value for RAG prompts and examples',
            evidenceLevel: 'EXPERT_OPINION',
            tagsModality: ['CBT'],
            tagsCulturalContext: ['collectivism', 'intergenerational values'],
            tagsPopulation: ['Adults'],
            tagsDocumentationStyle: ['DAP', 'SOAP'],
            tagsInterventionCategory: ['Cognitive restructuring', 'Values work'],
            tagsSupervision: true,
            geography: 'US',
            language: 'English',
            controlledVocabTerms: ['cultural_context', 'modality'],
            ragInclusionStatus: 'PENDING',
            chunkingNotes: 'Chunk by theme and add examples',
            chunkingStrategy: 'SEMANTIC',
            deIdentificationStatus: 'NA',
            ipRightsStatus: 'CLEARED',
            addedBy: 'Brandi'
        }
    });

    // DATA_0001 - AWS Marketplace datasets
    const data0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'DATA_0001',
            sourceType: 'DATASET',
            sourceCategory: 'CURATED_DATASETS',
            title: 'AWS Marketplace mental health datasets',
            authorOrganization: 'Third party vendors',
            urlOrLocation: 'AWS Marketplace',
            accessType: 'PAYWALLED',
            license: 'Vendor specific',
            summary: 'Candidate datasets for training and retrieval',
            keyFindings: 'Requires de-identification review and schema mapping',
            tagsRiskLanguage: ['risk language present'],
            tagsPopulation: ['Various'],
            language: 'English',
            controlledVocabTerms: ['pii', 'phi'],
            ragInclusionStatus: 'PENDING',
            chunkingNotes: 'Create summary keys that map to full records',
            chunkingStrategy: 'CUSTOM',
            deIdentificationStatus: 'REQUIRED',
            ipRightsStatus: 'RESTRICTED',
            addedBy: 'Yash'
        }
    });

    // Additional entries based on architecture diagram sections

    // Webinar entry
    const web0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'WEB_0001',
            sourceType: 'WEBINAR',
            sourceCategory: 'CYMBIOSE_IP',
            title: 'Culturally Responsive Documentation Best Practices',
            authorOrganization: 'Cymbiose AI',
            accessType: 'INTERNAL',
            summary: 'Webinar covering culturally responsive documentation techniques',
            keyFindings: 'Can be used to refer to relevant suggestions and interventions',
            evidenceLevel: 'EXPERT_OPINION',
            tagsModality: ['Integrative'],
            tagsCulturalContext: ['multicultural', 'cross-cultural'],
            tagsDocumentationStyle: ['DAP', 'SOAP', 'Narrative'],
            tagsSupervision: false,
            language: 'English',
            controlledVocabTerms: ['documentation', 'cultural_context'],
            ragInclusionStatus: 'PENDING',
            chunkingStrategy: 'PARAGRAPH',
            ipRightsStatus: 'CLEARED',
            addedBy: 'Brandi'
        }
    });

    // Supervision playbook
    const sup0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'SUP_0001',
            sourceType: 'SUPERVISION',
            sourceCategory: 'CYMBIOSE_IP',
            title: 'Clinical Supervision Framework for Bias Awareness',
            authorOrganization: 'Cymbiose AI',
            accessType: 'INTERNAL',
            summary: 'Supervision playbook for identifying and addressing bias in clinical work',
            keyFindings: 'Can be used for suggestions for Supervisors',
            evidenceLevel: 'EXPERT_OPINION',
            tagsBiasType: ['supervision bias', 'power dynamics'],
            tagsSupervision: true,
            tagsInterventionCategory: ['Bias mitigation', 'Reflective practice'],
            language: 'English',
            controlledVocabTerms: ['supervision', 'bias_type'],
            ragInclusionStatus: 'PENDING',
            chunkingNotes: 'Chunk by supervision scenario',
            chunkingStrategy: 'SEMANTIC',
            ipRightsStatus: 'CLEARED',
            addedBy: 'Brandi'
        }
    });

    // CE Course entry
    const ce0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'CE_0001',
            sourceType: 'COURSE',
            sourceCategory: 'CE_PARTNERS',
            title: 'Cultural Competency in Clinical Practice',
            authorOrganization: 'Affirm CE Partner',
            accessType: 'PARTNER',
            license: 'Partner agreement',
            summary: 'CE course on developing cultural competency skills',
            keyFindings: 'Course tags and outcomes aligned with clinical practice',
            evidenceLevel: 'EXPERT_OPINION',
            tagsModality: ['CBT', 'ACT', 'Relational'],
            tagsCulturalContext: ['multicultural', 'cross-cultural', 'systemic barriers'],
            tagsPopulation: ['Adults', 'Adolescents'],
            language: 'English',
            controlledVocabTerms: ['ce_course', 'cultural_context'],
            ragInclusionStatus: 'PENDING',
            ipRightsStatus: 'LICENSED',
            addedBy: 'Yash'
        }
    });

    // Peer-reviewed article
    const art0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'ART_0001',
            sourceType: 'ARTICLE',
            sourceCategory: 'MEDIA_LITERATURE',
            title: 'Cultural and Societal Factors Predicting Anxiety Disorders',
            authorOrganization: 'Journal of Cross-Cultural Psychology',
            year: 2023,
            accessType: 'PUBLIC',
            peerReviewed: true,
            sourceQualityScore: 5,
            summary: 'Meta-analysis examining cultural factors in anxiety disorder prevalence',
            keyFindings: 'Identifies key cultural predictors and protective factors',
            evidenceLevel: 'META_ANALYSIS',
            tagsModality: ['CBT', 'ACT'],
            tagsCulturalContext: ['collectivism', 'individualism', 'familism'],
            tagsPopulation: ['Adults'],
            language: 'English',
            controlledVocabTerms: ['diagnostic', 'cultural_context'],
            ragInclusionStatus: 'APPROVED',
            chunkingStrategy: 'PARAGRAPH',
            ipRightsStatus: 'CLEARED',
            referenceFormat: 'APA',
            addedBy: 'Yash'
        }
    });

    // Clinical Handbook entry
    const hb0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'HB_0001',
            sourceType: 'HANDBOOK',
            sourceCategory: 'MEDIA_LITERATURE',
            title: 'DSM-5-TR Cultural Formulation Interview Guide',
            authorOrganization: 'American Psychiatric Association',
            year: 2022,
            accessType: 'PAYWALLED',
            peerReviewed: true,
            sourceQualityScore: 5,
            summary: 'Official guide for culturally-informed diagnostic assessment',
            keyFindings: 'Structured approach to cultural assessment in diagnosis',
            evidenceLevel: 'EXPERT_OPINION',
            tagsCulturalContext: ['multicultural', 'cross-cultural'],
            tagsDocumentationStyle: ['Intake', 'Assessment'],
            tagsPopulation: ['Adults', 'Adolescents', 'Children'],
            language: 'English',
            controlledVocabTerms: ['diagnostic', 'cultural_context', 'documentation'],
            ragInclusionStatus: 'APPROVED',
            chunkingStrategy: 'SEMANTIC',
            ipRightsStatus: 'PERMISSION_REQUIRED',
            referenceFormat: 'APA',
            addedBy: 'Brandi'
        }
    });

    // Bias prompt entry
    const prm0001 = await prisma.kBEntry.create({
        data: {
            kbId: 'PRM_0001',
            sourceType: 'PROMPT',
            sourceCategory: 'BIAS_DETECTION',
            title: 'Internal Bias Detection Prompts Library',
            authorOrganization: 'Cymbiose AI',
            accessType: 'INTERNAL',
            summary: 'Collection of prompts to help identify and reduce bias in documentation',
            keyFindings: 'Helps in bias reduction in clinical notes and documentation',
            evidenceLevel: 'EXPERT_OPINION',
            tagsBiasType: ['confirmation bias', 'availability bias', 'stereotyping'],
            tagsDocumentationStyle: ['DAP', 'SOAP', 'BIRP', 'Narrative'],
            language: 'English',
            controlledVocabTerms: ['bias_type', 'documentation'],
            ragInclusionStatus: 'APPROVED',
            chunkingNotes: 'Each prompt as separate chunk with examples',
            chunkingStrategy: 'SEMANTIC',
            ipRightsStatus: 'CLEARED',
            addedBy: 'Brandi'
        }
    });

    console.log('✅ Created 9 KB entries\n');

    // ============================================================================
    // CREATE SAMPLE CHUNKS FOR APPROVED ENTRIES
    // ============================================================================
    console.log('📄 Creating sample chunks...');

    // Chunks for ART_0001
    await prisma.kBChunk.createMany({
        data: [
            {
                kbEntryId: art0001.id,
                chunkIndex: 0,
                content: 'Cultural factors play a significant role in the presentation, diagnosis, and treatment of anxiety disorders. This meta-analysis examined 47 studies across 23 countries to identify cultural predictors of anxiety.',
                tokenCount: 45,
                tagsModality: ['CBT', 'ACT'],
                tagsCultural: ['cross-cultural'],
                tagsPopulation: ['Adults']
            },
            {
                kbEntryId: art0001.id,
                chunkIndex: 1,
                content: 'Key findings indicate that collectivist cultures show lower rates of generalized anxiety but higher rates of somatic presentations. Individualist cultures demonstrate higher rates of worry-focused anxiety.',
                tokenCount: 38,
                tagsModality: ['CBT'],
                tagsCultural: ['collectivism', 'individualism'],
                tagsPopulation: ['Adults']
            },
            {
                kbEntryId: art0001.id,
                chunkIndex: 2,
                content: 'Familism emerged as a protective factor across multiple cultures, with strong family support networks associated with reduced anxiety severity and better treatment outcomes.',
                tokenCount: 32,
                tagsModality: ['Relational'],
                tagsCultural: ['familism'],
                tagsPopulation: ['Adults']
            }
        ]
    });

    // Chunks for PRM_0001
    await prisma.kBChunk.createMany({
        data: [
            {
                kbEntryId: prm0001.id,
                chunkIndex: 0,
                content: 'CONFIRMATION BIAS CHECK: Before documenting, ask yourself: Am I looking for information that confirms my initial impression? Have I considered alternative explanations for the client\'s presentation?',
                tokenCount: 42,
                tagsModality: [],
                tagsCultural: [],
                tagsPopulation: []
            },
            {
                kbEntryId: prm0001.id,
                chunkIndex: 1,
                content: 'CULTURAL LENS PROMPT: Consider how the client\'s cultural background may influence their symptom expression. Avoid pathologizing culturally normative behaviors or communication styles.',
                tokenCount: 35,
                tagsModality: [],
                tagsCultural: ['multicultural'],
                tagsPopulation: []
            },
            {
                kbEntryId: prm0001.id,
                chunkIndex: 2,
                content: 'STEREOTYPING GUARD: Ensure documentation reflects the individual client, not group-level assumptions. Use client\'s own words and descriptions when possible.',
                tokenCount: 30,
                tagsModality: [],
                tagsCultural: [],
                tagsPopulation: []
            }
        ]
    });

    console.log('✅ Created 6 sample chunks\n');

    // ============================================================================
    // SUMMARY
    // ============================================================================
    const entryCount = await prisma.kBEntry.count();
    const chunkCount = await prisma.kBChunk.count();
    const sourceCount = await prisma.dataSource.count();

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 Database seeded successfully!');
    console.log('═══════════════════════════════════════════════');
    console.log(`📚 Data Sources: ${sourceCount}`);
    console.log(`📖 KB Entries: ${entryCount}`);
    console.log(`📄 Chunks: ${chunkCount}`);
    console.log('═══════════════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
