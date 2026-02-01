'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface KBChunk {
    id: string;
    chunkIndex: number;
    content: string;
    tokenCount: number;
}

interface KBEntry {
    id: string;
    kbId: string;
    sourceType: string;
    title: string;
    authorOrganization: string | null;
    summary: string | null;
    tagsModality: string[];
    tagsCulturalContext: string[];
    ragInclusionStatus: string;
    sourceQualityScore: number | null;
    dateAdded: string;
    _count: { chunks: number };
    chunks?: KBChunk[];
}

// Icon Components
const PlusIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const SearchIcon = () => (
    <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const EditIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const XIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ChunksIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
);

export default function CatalogPage() {
    const [entries, setEntries] = useState<KBEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [qualityFilter, setQualityFilter] = useState('');
    const [editingEntry, setEditingEntry] = useState<KBEntry | null>(null);
    const [editForm, setEditForm] = useState({ title: '', summary: '', ragInclusionStatus: '' });
    const [viewingChunks, setViewingChunks] = useState<{ entry: KBEntry; chunks: KBChunk[] } | null>(null);
    const [loadingChunks, setLoadingChunks] = useState(false);

    async function loadChunks(entry: KBEntry) {
        setLoadingChunks(true);
        try {
            const res = await fetch(`/api/entries/${entry.id}/chunks`);
            const chunks = await res.json();
            setViewingChunks({ entry, chunks: Array.isArray(chunks) ? chunks : [] });
        } catch (err) {
            console.error('Failed to load chunks:', err);
            setViewingChunks({ entry, chunks: [] });
        } finally {
            setLoadingChunks(false);
        }
    }

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchEntries();
    }, [sourceFilter, statusFilter, qualityFilter, debouncedSearch]);

    async function fetchEntries() {
        setLoading(true);
        const params = new URLSearchParams();
        if (sourceFilter) params.set('sourceType', sourceFilter);
        if (statusFilter) params.set('ragStatus', statusFilter);
        if (qualityFilter) params.set('minQuality', qualityFilter);
        if (debouncedSearch) params.set('search', debouncedSearch);

        const res = await fetch(`/api/entries?${params}`);
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
    }

    // Client-side filtering removed - using server-side filtering now

    async function deleteEntry(id: string) {
        if (!confirm('Are you sure you want to delete this entry?')) return;
        await fetch(`/api/entries/${id}`, { method: 'DELETE' });
        fetchEntries();
    }

    function openEditModal(entry: KBEntry) {
        setEditingEntry(entry);
        setEditForm({
            title: entry.title,
            summary: entry.summary || '',
            ragInclusionStatus: entry.ragInclusionStatus
        });
    }

    async function saveEdit() {
        if (!editingEntry) return;

        try {
            const res = await fetch(`/api/entries/${editingEntry.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });

            if (res.ok) {
                setEditingEntry(null);
                fetchEntries();
            } else {
                alert('Failed to update entry');
            }
        } catch {
            alert('Error updating entry');
        }
    }

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-100">KB Catalog</h1>
                    <p className="text-slate-400 mt-1">Browse and manage knowledge base entries</p>
                </div>
                <Link href="/add-entry" className="btn-primary">
                    <PlusIcon />
                    Add Entry
                </Link>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex flex-wrap gap-4">
                    {/* Search Input - explicit sizing */}
                    <div className="relative" style={{ minWidth: '280px', flex: '1 1 280px' }}>
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <SearchIcon />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by title or KB ID..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="input w-full"
                            style={{ color: '#f1f5f9', backgroundColor: '#334155', paddingLeft: '44px' }}
                        />
                    </div>
                    <select
                        value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value)}
                        className="input w-auto"
                    >
                        <option value="">All Sources</option>
                        <option value="RESEARCH">Research</option>
                        <option value="CLINICAL_GUIDELINE">Clinical Guideline</option>
                        <option value="BLOG">Blog</option>
                        <option value="BOOK">Book</option>
                        <option value="VIDEO_TRANSCRIPT">Video</option>
                        <option value="WORKSHEET">Worksheet</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="input w-auto"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="EXCLUDED">Excluded</option>
                        <option value="REVIEW_NEEDED">Review Needed</option>
                    </select>
                    <select
                        value={qualityFilter}
                        onChange={e => setQualityFilter(e.target.value)}
                        className="input w-auto"
                    >
                        <option value="">All Quality</option>
                        <option value="5">★★★★★ (5)</option>
                        <option value="4">★★★★☆ (4+)</option>
                        <option value="3">★★★☆☆ (3+)</option>
                        <option value="2">★★☆☆☆ (2+)</option>
                        <option value="1">★☆☆☆☆ (1+)</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="skeleton h-8 w-48 mx-auto mb-4"></div>
                        <div className="skeleton h-4 w-32 mx-auto"></div>
                    </div>
                ) : entries.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-700 flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-slate-300">No entries found</h3>
                        <p className="text-slate-500 mt-1">
                            <Link href="/add-entry" className="text-teal-400 hover:text-teal-300">Add your first entry</Link> to get started
                        </p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-800/50 border-b border-slate-700">
                            <tr className="text-left text-slate-400">
                                <th className="px-4 py-3 font-medium">KB ID</th>
                                <th className="px-4 py-3 font-medium">Title</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Tags</th>
                                <th className="px-4 py-3 font-medium text-center">Quality</th>
                                <th className="px-4 py-3 font-medium text-center">Chunks</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map(entry => (
                                <tr key={entry.id} className="table-row">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.kbId}</td>
                                    <td className="px-4 py-3 max-w-[250px] truncate font-medium text-slate-200" title={entry.title}>
                                        {entry.title}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">{formatSourceType(entry.sourceType)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {entry.tagsModality.slice(0, 2).map(t => (
                                                <span key={t} className="tag tag-modality">{t}</span>
                                            ))}
                                            {entry.tagsModality.length > 2 && (
                                                <span className="text-xs text-slate-500">+{entry.tagsModality.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {entry.sourceQualityScore ? (
                                            <span className="text-amber-400" title={`Quality: ${entry.sourceQualityScore}/5`}>
                                                {'★'.repeat(entry.sourceQualityScore)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center text-slate-400">{entry._count?.chunks || 0}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={entry.ragInclusionStatus} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {entry._count?.chunks > 0 && (
                                                <button
                                                    onClick={() => loadChunks(entry)}
                                                    className="icon-btn text-teal-400 hover:bg-teal-500/20"
                                                    title="View chunks"
                                                    disabled={loadingChunks}
                                                >
                                                    <ChunksIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(entry)}
                                                className="icon-btn edit"
                                                title="Edit entry"
                                            >
                                                <EditIcon />
                                            </button>
                                            <button
                                                onClick={() => deleteEntry(entry.id)}
                                                className="icon-btn delete"
                                                title="Delete entry"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-xs text-slate-500 mt-4">
                Showing {entries.length} entries
            </p>

            {/* Edit Modal */}
            {editingEntry && (
                <div className="modal-overlay" onClick={() => setEditingEntry(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-slate-100">Edit Entry</h2>
                            <button onClick={() => setEditingEntry(null)} className="icon-btn">
                                <XIcon />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">KB ID</label>
                                <div className="text-sm text-slate-500 font-mono">{editingEntry.kbId}</div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Summary</label>
                                <textarea
                                    value={editForm.summary}
                                    onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                                    rows={4}
                                    className="input"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">RAG Status</label>
                                <select
                                    value={editForm.ragInclusionStatus}
                                    onChange={e => setEditForm({ ...editForm, ragInclusionStatus: e.target.value })}
                                    className="input"
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approved</option>
                                    <option value="EXCLUDED">Excluded</option>
                                    <option value="REVIEW_NEEDED">Review Needed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                            <button onClick={() => setEditingEntry(null)} className="btn-secondary">
                                Cancel
                            </button>
                            <button onClick={saveEdit} className="btn-primary">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Chunks Modal */}
            {viewingChunks && (
                <div className="modal-overlay" onClick={() => setViewingChunks(null)}>
                    <div className="modal-content max-w-4xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-100">
                                    Chunks for: {viewingChunks.entry.title}
                                </h2>
                                <p className="text-sm text-slate-400 mt-1">
                                    {viewingChunks.chunks.length} chunks • {viewingChunks.entry.kbId}
                                </p>
                            </div>
                            <button
                                onClick={() => setViewingChunks(null)}
                                className="text-slate-400 hover:text-slate-200"
                            >
                                <XIcon />
                            </button>
                        </div>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {viewingChunks.chunks.length === 0 ? (
                                <p className="text-slate-500 text-center py-8">No chunks found</p>
                            ) : (
                                viewingChunks.chunks.map(chunk => (
                                    <div key={chunk.id} className="bg-slate-700/50 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-semibold text-teal-400">
                                                Chunk #{chunk.chunkIndex + 1}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                                {chunk.tokenCount} tokens
                                            </span>
                                        </div>
                                        <pre className="text-sm text-slate-300 whitespace-pre-wrap font-mono overflow-hidden" style={{ maxHeight: '200px' }}>
                                            {chunk.content}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function formatSourceType(type: string): string {
    const labels: Record<string, string> = {
        RESEARCH: 'Research',
        CLINICAL_GUIDELINE: 'Clinical',
        BLOG: 'Blog',
        BOOK: 'Book',
        VIDEO_TRANSCRIPT: 'Video',
        WORKSHEET: 'Worksheet',
        OTHER: 'Other'
    };
    return labels[type] || type;
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: 'badge-warning',
        APPROVED: 'badge-success',
        EXCLUDED: 'bg-slate-700 text-slate-400',
        REVIEW_NEEDED: 'badge-error'
    };

    const labels: Record<string, string> = {
        PENDING: 'Pending',
        APPROVED: 'Approved',
        EXCLUDED: 'Excluded',
        REVIEW_NEEDED: 'Review'
    };

    return (
        <span className={`badge ${styles[status] || styles.PENDING}`}>
            {labels[status] || status}
        </span>
    );
}
