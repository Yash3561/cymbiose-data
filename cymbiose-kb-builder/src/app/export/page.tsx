'use client';

import { useState } from 'react';

export default function ExportPage() {
    const [format, setFormat] = useState<'full' | 'chunks'>('full');
    const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'all'>('APPROVED');
    const [exportData, setExportData] = useState<object | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        setLoading(true);

        const params = new URLSearchParams();
        params.set('format', format);
        if (status !== 'all') params.set('ragStatus', status);

        const res = await fetch(`/api/export?${params}`);
        const data = await res.json();
        setExportData(data);
        setLoading(false);
    }

    function downloadJSON() {
        if (!exportData) return;

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cymbiose_kb_${format}_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="p-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Export KB</h1>
                <p className="text-slate-500">Export knowledge base for vector embedding or API access</p>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
                <h2 className="font-semibold text-slate-700 mb-4">Export Options</h2>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Format</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="format"
                                    checked={format === 'full'}
                                    onChange={() => setFormat('full')}
                                />
                                <span className="text-sm">Full entries (with all metadata)</span>
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name="format"
                                    checked={format === 'chunks'}
                                    onChange={() => setFormat('chunks')}
                                />
                                <span className="text-sm">Chunks only (for vector embedding)</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">RAG Status Filter</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as typeof status)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                        >
                            <option value="APPROVED">Approved only</option>
                            <option value="PENDING">Pending only</option>
                            <option value="all">All entries</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleExport}
                    disabled={loading}
                    className="mt-6 px-6 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                    {loading ? 'Exporting...' : '📤 Generate Export'}
                </button>
            </div>

            {/* Export Preview */}
            {exportData && (
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-700">Export Preview</h3>
                            <p className="text-sm text-slate-500">
                                {(exportData as { totalEntries?: number; totalChunks?: number }).totalEntries || 0} entries
                                {format === 'chunks' && `, ${(exportData as { totalChunks?: number }).totalChunks || 0} chunks`}
                            </p>
                        </div>
                        <button
                            onClick={downloadJSON}
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                        >
                            ⬇️ Download JSON
                        </button>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 max-h-96 overflow-auto">
                        <pre className="text-xs text-green-400 font-mono">
                            {JSON.stringify(exportData, null, 2).substring(0, 5000)}
                            {JSON.stringify(exportData, null, 2).length > 5000 && '\n\n... [truncated]'}
                        </pre>
                    </div>
                </div>
            )}

            {/* API Documentation */}
            <div className="mt-8 bg-slate-100 rounded-lg p-5">
                <h3 className="font-semibold text-slate-700 mb-3">🔌 API Endpoints</h3>
                <div className="space-y-3 text-sm">
                    <div className="bg-white rounded p-3">
                        <code className="text-teal-600">GET /api/entries</code>
                        <p className="text-slate-500 mt-1">List all KB entries with filter support</p>
                    </div>
                    <div className="bg-white rounded p-3">
                        <code className="text-teal-600">GET /api/export?format=chunks&ragStatus=APPROVED</code>
                        <p className="text-slate-500 mt-1">Export chunked data for vector embedding</p>
                    </div>
                    <div className="bg-white rounded p-3">
                        <code className="text-teal-600">POST /api/entries</code>
                        <p className="text-slate-500 mt-1">Create new KB entry (JSON body)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
