'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
    dateAdded: string;
    _count: { chunks: number };
}

export default function CatalogPage() {
    const [entries, setEntries] = useState<KBEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => {
        fetchEntries();
    }, [sourceFilter, statusFilter]);

    async function fetchEntries() {
        setLoading(true);
        const params = new URLSearchParams();
        if (sourceFilter) params.set('sourceType', sourceFilter);
        if (statusFilter) params.set('ragStatus', statusFilter);

        const res = await fetch(`/api/entries?${params}`);
        const data = await res.json();
        setEntries(Array.isArray(data) ? data : []);
        setLoading(false);
    }

    const filteredEntries = entries.filter(e =>
        !search ||
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.kbId.toLowerCase().includes(search.toLowerCase())
    );

    async function deleteEntry(id: string) {
        if (!confirm('Delete this entry?')) return;
        await fetch(`/api/entries/${id}`, { method: 'DELETE' });
        fetchEntries();
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">KB Catalog</h1>
                    <p className="text-slate-500">Browse and manage knowledge base entries</p>
                </div>
                <Link
                    href="/add-entry"
                    className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700"
                >
                    ➕ Add Entry
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                <div className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Search by title or KB ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                    <select
                        value={sourceFilter}
                        onChange={e => setSourceFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">All Sources</option>
                        <option value="LITERATURE">Literature</option>
                        <option value="BLOG">Blog</option>
                        <option value="DATASET">Dataset</option>
                        <option value="WEBINAR">Webinar</option>
                        <option value="COURSE">Course</option>
                        <option value="HANDBOOK">Handbook</option>
                        <option value="ARTICLE">Article</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="EXCLUDED">Excluded</option>
                        <option value="REVIEW_NEEDED">Review Needed</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Loading...</div>
                ) : filteredEntries.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        No entries found. <Link href="/add-entry" className="text-teal-600 hover:underline">Add your first entry</Link>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr className="text-left text-slate-500">
                                <th className="px-4 py-3 font-medium">KB ID</th>
                                <th className="px-4 py-3 font-medium">Title</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Tags</th>
                                <th className="px-4 py-3 font-medium">Chunks</th>
                                <th className="px-4 py-3 font-medium">Status</th>
                                <th className="px-4 py-3 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map(entry => (
                                <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-mono text-xs">{entry.kbId}</td>
                                    <td className="px-4 py-3 max-w-[250px] truncate" title={entry.title}>
                                        {entry.title}
                                    </td>
                                    <td className="px-4 py-3">{entry.sourceType}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1">
                                            {entry.tagsModality.slice(0, 2).map(t => (
                                                <span key={t} className="tag tag-modality">{t}</span>
                                            ))}
                                            {entry.tagsModality.length > 2 && (
                                                <span className="text-xs text-slate-400">+{entry.tagsModality.length - 2}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">{entry._count?.chunks || 0}</td>
                                    <td className="px-4 py-3">
                                        <StatusBadge status={entry.ragInclusionStatus} />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link
                                                href={`/entry/${entry.id}`}
                                                className="text-xs text-teal-600 hover:underline"
                                            >
                                                Edit
                                            </Link>
                                            <button
                                                onClick={() => deleteEntry(entry.id)}
                                                className="text-xs text-red-600 hover:underline"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-xs text-slate-400 mt-4">
                Showing {filteredEntries.length} of {entries.length} entries
            </p>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: Record<string, string> = {
        PENDING: 'bg-amber-100 text-amber-700',
        APPROVED: 'bg-green-100 text-green-700',
        EXCLUDED: 'bg-slate-100 text-slate-600',
        REVIEW_NEEDED: 'bg-red-100 text-red-700'
    };

    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status] || styles.PENDING}`}>
            {status}
        </span>
    );
}
