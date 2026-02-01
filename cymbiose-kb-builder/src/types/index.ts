// Type definitions for KB Builder
// Aligned with Brandi's architecture document

export interface KBEntryFormData {
    kbId: string;
    sourceType: string;
    sourceCategory: string;
    title: string;
    authorOrganization?: string;
    year?: number;
    urlOrLocation?: string;
    accessType: string;
    license?: string;
    peerReviewed: boolean;
    sourceQualityScore?: number;
    summary?: string;
    keyFindings?: string;
    evidenceLevel?: string;
    tagsModality: string[];
    tagsCulturalContext: string[];
    tagsRiskLanguage: string[];
    tagsPopulation: string[];
    tagsDocumentationStyle: string[];
    tagsInterventionCategory: string[];
    tagsBiasType: string[];
    tagsSupervision: boolean;
    geography?: string;
    language: string;
    controlledVocabTerms: string[];
    ragInclusionStatus: string;
    chunkingNotes?: string;
    chunkingStrategy?: string;
    deIdentificationStatus: string;
    ipRightsStatus: string;
    hipaaCompliant: boolean;
    addedBy: string;
    notes?: string;
}

export interface ScrapeResult {
    success: boolean;
    title?: string;
    content?: string;
    contentLength?: number;
    error?: string;
}

// Predefined tag options from Brandi's document
export const TAG_OPTIONS = {
    modality: [
        'CBT', 'ACT', 'DBT', 'Relational', 'Integrative',
        'Psychodynamic', 'Trauma-Informed', 'EMDR', 'Motivational Interviewing',
        'Person-Centered', 'Solution-Focused', 'Narrative'
    ],
    culturalContext: [
        'collectivism', 'familism', 'intergenerational values',
        'individualism', 'multicultural', 'cross-cultural',
        'systemic barriers', 'racism', 'structural factors',
        'acculturation', 'immigration', 'identity'
    ],
    riskLanguage: [
        'risk language present', 'SI indicators', 'HI indicators',
        'safety concerns', 'crisis language', 'hopelessness',
        'protective factors', 'warning signs'
    ],
    population: [
        'Adults', 'Children', 'Adolescents', 'Older Adults',
        'Perinatal', 'Caregiver', 'Student', 'Veterans', 'LGBTQ+',
        'Couples', 'Families', 'Groups'
    ],
    documentationStyle: [
        'DAP', 'SOAP', 'BIRP', 'Narrative', 'Progress Note',
        'Intake', 'Treatment Plan', 'Discharge Summary',
        'Assessment', 'Supervision Notes'
    ],
    interventionCategory: [
        'Cognitive restructuring', 'Values work', 'Exposure therapy',
        'Behavioral activation', 'Mindfulness', 'Thought records',
        'Acceptance strategies', 'Distress tolerance', 'Interpersonal skills',
        'Bias mitigation', 'Reflective practice', 'Psychoeducation'
    ],
    biasType: [
        'confirmation bias', 'availability bias', 'anchoring bias',
        'stereotyping', 'implicit bias', 'cognitive bias',
        'fundamental attribution error', 'halo effect',
        'supervision bias', 'power dynamics'
    ],
    controlledVocab: [
        'bias_type', 'cultural_context', 'modality', 'intervention',
        'diagnostic', 'pii', 'phi', 'documentation', 'supervision',
        'ce_course', 'taxonomy'
    ]
};

// Source Types from Prisma schema
export const SOURCE_TYPES = [
    'LITERATURE', 'BLOG', 'DATASET', 'WEBINAR', 'COURSE',
    'HANDBOOK', 'PODCAST', 'ARTICLE', 'SUPERVISION', 'INTERNAL',
    'QA', 'PROMPT'
];

// Source Categories from Architecture Diagram
export const SOURCE_CATEGORIES = [
    { value: 'CYMBIOSE_IP', label: 'Cymbiose IP', description: 'Blogs, Webinars, Supervision playbooks' },
    { value: 'CE_PARTNERS', label: 'CE & Partners', description: 'Affirm CE, Course catalogs' },
    { value: 'MEDIA_LITERATURE', label: 'Media & Literature', description: 'Peer-reviewed, Handbooks, Podcasts' },
    { value: 'CULTURE_DIAGNOSIS', label: 'Culture & Diagnosis', description: 'Mental health across cultures' },
    { value: 'BIAS_DETECTION', label: 'Bias Detection', description: 'Bias taxonomy, Ethical safeguards' },
    { value: 'CURATED_DATASETS', label: 'Curated Datasets', description: 'AWS datasets, Clinical data' },
    { value: 'EXPERT_ADVISORS', label: 'Expert Advisors', description: 'TBA' }
];

export const ACCESS_TYPES = ['INTERNAL', 'PUBLIC', 'PAYWALLED', 'RESTRICTED', 'PARTNER'];

export const RAG_STATUSES = ['PENDING', 'APPROVED', 'EXCLUDED', 'REVIEW_NEEDED', 'ARCHIVED'];

export const EVIDENCE_LEVELS = [
    'META_ANALYSIS', 'RCT', 'COHORT', 'CASE_STUDY', 'EXPERT_OPINION', 'ANECDOTAL'
];

export const CHUNKING_STRATEGIES = ['SEMANTIC', 'FIXED_SIZE', 'PARAGRAPH', 'SENTENCE', 'CUSTOM'];

export const DE_IDENTIFICATION_STATUSES = ['NA', 'REQUIRED', 'IN_PROGRESS', 'COMPLETED', 'VERIFIED'];

export const IP_RIGHTS_STATUSES = ['PENDING', 'CLEARED', 'RESTRICTED', 'PERMISSION_REQUIRED', 'LICENSED'];

export const REFERENCE_FORMATS = ['APA', 'MLA', 'CHICAGO', 'VANCOUVER', 'CUSTOM'];
