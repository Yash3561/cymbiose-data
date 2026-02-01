'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    TAG_OPTIONS, SOURCE_TYPES, SOURCE_CATEGORIES, ACCESS_TYPES,
    RAG_STATUSES, DE_IDENTIFICATION_STATUSES, IP_RIGHTS_STATUSES,
    EVIDENCE_LEVELS, CHUNKING_STRATEGIES
} from '@/types';

export default function AddEntryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'basic' | 'content' | 'tags' | 'status'>('basic');

    const [formData, setFormData] = useState({
        kbId: '',
        sourceType: 'ARTICLE',
        sourceCategory: 'CYMBIOSE_IP',
        title: '',
        authorOrganization: '',
        year: '',
        urlOrLocation: '',
        accessType: 'INTERNAL',
        license: '',
        peerReviewed: false,
        sourceQualityScore: '',
        summary: '',
        keyFindings: '',
        evidenceLevel: '',
        tagsModality: [] as string[],
        tagsCulturalContext: [] as string[],
        tagsRiskLanguage: [] as string[],
        tagsPopulation: [] as string[],
        tagsDocumentationStyle: [] as string[],
        tagsInterventionCategory: [] as string[],
        tagsBiasType: [] as string[],
        tagsSupervision: false,
        geography: '',
        language: 'English',
        controlledVocabTerms: [] as string[],
        ragInclusionStatus: 'PENDING',
        chunkingNotes: '',
        chunkingStrategy: '',
        deIdentificationStatus: 'NA',
        ipRightsStatus: 'PENDING',
        hipaaCompliant: false,
        addedBy: '',
        notes: ''
    });

    function toggleTag(field: keyof typeof formData, tag: string) {
        const current = formData[field] as string[];
        const updated = current.includes(tag)
            ? current.filter(t => t !== tag)
            : [...current, tag];
        setFormData({ ...formData, [field]: updated });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                router.push('/catalog');
            } else {
                const error = await res.json();
                alert(`Failed to create entry: ${error.error}`);
            }
        } catch (error) {
            alert('Error creating entry');
        } finally {
            setLoading(false);
        }
    }

    const tabs = [
        { id: 'basic', label: 'Basic Info', step: '1' },
        { id: 'content', label: 'Content', step: '2' },
        { id: 'tags', label: 'Tags', step: '3' },
        { id: 'status', label: 'Status', step: '4' }
    ];

    return (
        <div className="p-8 max-w-5xl fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-100">Add KB Entry</h1>
                <p className="text-slate-400 mt-1">Create a new knowledge base entry with clinical taxonomy tags</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 border-b border-slate-200">
                {tabs.map((tab, idx) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-teal-600 text-teal-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${activeTab === tab.id ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                            {tab.step}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Tab 1: Basic Info */}
                {activeTab === 'basic' && (
                    <section className="card p-6">
                        <h2 className="font-semibold text-slate-700 mb-4">Basic Information</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">KB ID *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.kbId}
                                    onChange={e => setFormData({ ...formData, kbId: e.target.value })}
                                    placeholder="e.g., LIT_0002, BLOG_0002"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">Format: TYPE_NUMBER</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Source Category *</label>
                                <select
                                    value={formData.sourceCategory}
                                    onChange={e => setFormData({ ...formData, sourceCategory: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    {SOURCE_CATEGORIES.map(c => (
                                        <option key={c.value} value={c.value}>{c.label} - {c.description}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Source Type *</label>
                                <select
                                    value={formData.sourceType}
                                    onChange={e => setFormData({ ...formData, sourceType: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    {SOURCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Access Type</label>
                                <select
                                    value={formData.accessType}
                                    onChange={e => setFormData({ ...formData, accessType: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    {ACCESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Title *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Author/Organization</label>
                                <input
                                    type="text"
                                    value={formData.authorOrganization}
                                    onChange={e => setFormData({ ...formData, authorOrganization: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Year</label>
                                <input
                                    type="number"
                                    value={formData.year}
                                    onChange={e => setFormData({ ...formData, year: e.target.value })}
                                    placeholder="2024"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">URL or Location</label>
                                <input
                                    type="text"
                                    value={formData.urlOrLocation}
                                    onChange={e => setFormData({ ...formData, urlOrLocation: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Evidence Level</label>
                                <select
                                    value={formData.evidenceLevel}
                                    onChange={e => setFormData({ ...formData, evidenceLevel: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    <option value="">Select...</option>
                                    {EVIDENCE_LEVELS.map(l => <option key={l} value={l}>{l.replace('_', ' ')}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Quality Score (1-5)</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    value={formData.sourceQualityScore}
                                    onChange={e => setFormData({ ...formData, sourceQualityScore: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="flex items-center gap-4 col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.peerReviewed}
                                        onChange={e => setFormData({ ...formData, peerReviewed: e.target.checked })}
                                    />
                                    <span className="text-sm text-slate-600">Peer Reviewed</span>
                                </label>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={formData.hipaaCompliant}
                                        onChange={e => setFormData({ ...formData, hipaaCompliant: e.target.checked })}
                                    />
                                    <span className="text-sm text-slate-600">HIPAA Compliant</span>
                                </label>
                            </div>
                        </div>
                    </section>
                )}

                {/* Tab 2: Content */}
                {activeTab === 'content' && (
                    <section className="card p-6">
                        <h2 className="font-semibold text-slate-700 mb-4">Content</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Summary *</label>
                                <textarea
                                    value={formData.summary}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Clear description of the content..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Key Findings</label>
                                <textarea
                                    value={formData.keyFindings}
                                    onChange={e => setFormData({ ...formData, keyFindings: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Main takeaways and findings..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Chunking Notes</label>
                                <textarea
                                    value={formData.chunkingNotes}
                                    onChange={e => setFormData({ ...formData, chunkingNotes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="e.g., 'Create JSON snippets by bias type'"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Chunking Strategy</label>
                                <select
                                    value={formData.chunkingStrategy}
                                    onChange={e => setFormData({ ...formData, chunkingStrategy: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    <option value="">Select...</option>
                                    {CHUNKING_STRATEGIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* Tab 3: Tags */}
                {activeTab === 'tags' && (
                    <section className="card p-6">
                        <h2 className="font-semibold text-slate-700 mb-4">Clinical Taxonomy Tags</h2>
                        <div className="space-y-5">
                            <TagSection title="Modality" tags={TAG_OPTIONS.modality} selected={formData.tagsModality} onToggle={t => toggleTag('tagsModality', t)} color="modality" />
                            <TagSection title="Cultural Context" tags={TAG_OPTIONS.culturalContext} selected={formData.tagsCulturalContext} onToggle={t => toggleTag('tagsCulturalContext', t)} color="cultural" />
                            <TagSection title="Population" tags={TAG_OPTIONS.population} selected={formData.tagsPopulation} onToggle={t => toggleTag('tagsPopulation', t)} color="population" />
                            <TagSection title="Intervention Category" tags={TAG_OPTIONS.interventionCategory} selected={formData.tagsInterventionCategory} onToggle={t => toggleTag('tagsInterventionCategory', t)} color="intervention" />
                            <TagSection title="Bias Type" tags={TAG_OPTIONS.biasType} selected={formData.tagsBiasType} onToggle={t => toggleTag('tagsBiasType', t)} color="risk" />
                            <TagSection title="Documentation Style" tags={TAG_OPTIONS.documentationStyle} selected={formData.tagsDocumentationStyle} onToggle={t => toggleTag('tagsDocumentationStyle', t)} color="modality" />
                            <TagSection title="Risk Language" tags={TAG_OPTIONS.riskLanguage} selected={formData.tagsRiskLanguage} onToggle={t => toggleTag('tagsRiskLanguage', t)} color="risk" />

                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                                <input
                                    type="checkbox"
                                    id="supervision"
                                    checked={formData.tagsSupervision}
                                    onChange={e => setFormData({ ...formData, tagsSupervision: e.target.checked })}
                                />
                                <label htmlFor="supervision" className="text-sm text-slate-600">Supervision-related content</label>
                            </div>
                        </div>
                    </section>
                )}

                {/* Tab 4: Status */}
                {activeTab === 'status' && (
                    <section className="card p-6">
                        <h2 className="font-semibold text-slate-700 mb-4">Status & Metadata</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">RAG Inclusion Status</label>
                                <select
                                    value={formData.ragInclusionStatus}
                                    onChange={e => setFormData({ ...formData, ragInclusionStatus: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    {RAG_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">De-identification Status</label>
                                <select
                                    value={formData.deIdentificationStatus}
                                    onChange={e => setFormData({ ...formData, deIdentificationStatus: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    {DE_IDENTIFICATION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">IP Rights Status</label>
                                <select
                                    value={formData.ipRightsStatus}
                                    onChange={e => setFormData({ ...formData, ipRightsStatus: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                >
                                    {IP_RIGHTS_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">License</label>
                                <input
                                    type="text"
                                    value={formData.license}
                                    onChange={e => setFormData({ ...formData, license: e.target.value })}
                                    placeholder="e.g., Cymbiose IP, CC BY 4.0"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Geography</label>
                                <input
                                    type="text"
                                    value={formData.geography}
                                    onChange={e => setFormData({ ...formData, geography: e.target.value })}
                                    placeholder="e.g., US, Global"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Language</label>
                                <input
                                    type="text"
                                    value={formData.language}
                                    onChange={e => setFormData({ ...formData, language: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-600 mb-1">Added By *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.addedBy}
                                    onChange={e => setFormData({ ...formData, addedBy: e.target.value })}
                                    placeholder="Your name"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* Navigation & Submit */}
                <div className="mt-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        {activeTab !== 'basic' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const tabIndex = tabs.findIndex(t => t.id === activeTab);
                                    setActiveTab(tabs[tabIndex - 1].id as typeof activeTab);
                                }}
                                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800"
                            >
                                ← Previous
                            </button>
                        )}
                        {activeTab !== 'status' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const tabIndex = tabs.findIndex(t => t.id === activeTab);
                                    setActiveTab(tabs[tabIndex + 1].id as typeof activeTab);
                                }}
                                className="px-4 py-2 text-sm text-teal-600 font-medium"
                            >
                                Next →
                            </button>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Creating...' : 'Create Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
}

function TagSection({
    title,
    tags,
    selected,
    onToggle,
    color
}: {
    title: string;
    tags: string[];
    selected: string[];
    onToggle: (tag: string) => void;
    color: string;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">{title}</label>
            <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                    <button
                        key={tag}
                        type="button"
                        onClick={() => onToggle(tag)}
                        className={`tag cursor-pointer transition-all ${selected.includes(tag)
                            ? `tag-${color} ring-2 ring-offset-1 ring-teal-500`
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
    );
}
