'use client';

import { useState } from 'react';

// Icon Components
const FileIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const DownloadIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const CodeIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
    </svg>
);

export default function ExportPage() {
    const [format, setFormat] = useState<'json' | 'jsonl' | 'csv' | 'chunks'>('json');
    const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'all'>('APPROVED');
    const [exportData, setExportData] = useState<string | object | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleExport() {
        setLoading(true);
        setExportData(null);

        try {
            const params = new URLSearchParams();
            params.set('format', format);
            if (status !== 'all') params.set('ragStatus', status);

            const res = await fetch(`/api/export?${params}`);

            // CSV, JSONL, and chunks return text; JSON returns JSON object
            if (format === 'csv' || format === 'jsonl' || format === 'chunks') {
                const text = await res.text();
                setExportData(text);
            } else {
                const data = await res.json();
                setExportData(data);
            }
        } catch (error) {
            console.error('Export error:', error);
        } finally {
            setLoading(false);
        }
    }

    function handleDownload() {
        if (!exportData) return;

        const dateStr = new Date().toISOString().split('T')[0];
        let content: string;
        let mimeType: string;
        let extension: string;

        // CSV, JSONL, and chunks are text formats from API
        if (format === 'csv' || format === 'jsonl' || format === 'chunks') {
            content = exportData as string;
            mimeType = format === 'csv' ? 'text/csv' : 'application/x-jsonlines';
            extension = format === 'csv' ? 'csv' : 'jsonl';
        } else {
            // JSON is object
            content = JSON.stringify(exportData, null, 2);
            mimeType = 'application/json';
            extension = 'json';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cymbiose_kb_${format}_${dateStr}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const formatLabels: Record<string, string> = {
        json: 'JSON',
        jsonl: 'JSONL',
        csv: 'CSV',
        chunks: 'JSONL'
    };

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-100">Export KB</h1>
                <p className="text-slate-400 mt-1">Export knowledge base for vector embedding or API access</p>
            </div>

            {/* Export Options */}
            <div className="card p-6 mb-6">
                <h2 className="font-semibold text-slate-200 mb-4">Export Options</h2>

                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-3">Format</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${format === 'json' ? 'border-teal-500 bg-teal-500/10' : 'border-slate-600 hover:border-slate-500'
                                }`}>
                                <input
                                    type="radio"
                                    name="format"
                                    checked={format === 'json'}
                                    onChange={() => setFormat('json')}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200">JSON</span>
                                    <p className="text-xs text-slate-500">Full entries with metadata</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${format === 'jsonl' ? 'border-teal-500 bg-teal-500/10' : 'border-slate-600 hover:border-slate-500'
                                }`}>
                                <input
                                    type="radio"
                                    name="format"
                                    checked={format === 'jsonl'}
                                    onChange={() => setFormat('jsonl')}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200">JSONL</span>
                                    <p className="text-xs text-slate-500">For LLM fine-tuning</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${format === 'csv' ? 'border-teal-500 bg-teal-500/10' : 'border-slate-600 hover:border-slate-500'
                                }`}>
                                <input
                                    type="radio"
                                    name="format"
                                    checked={format === 'csv'}
                                    onChange={() => setFormat('csv')}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200">CSV</span>
                                    <p className="text-xs text-slate-500">Spreadsheet compatible</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${format === 'chunks' ? 'border-teal-500 bg-teal-500/10' : 'border-slate-600 hover:border-slate-500'
                                }`}>
                                <input
                                    type="radio"
                                    name="format"
                                    checked={format === 'chunks'}
                                    onChange={() => setFormat('chunks')}
                                    className="w-4 h-4 text-teal-600"
                                />
                                <div>
                                    <span className="text-sm font-medium text-slate-200">RAG Chunks</span>
                                    <p className="text-xs text-slate-500">For vector embedding</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-3">Status Filter</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value as typeof status)}
                            className="input"
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
                    className="btn-primary mt-6"
                >
                    <FileIcon />
                    {loading ? 'Generating...' : 'Generate Export'}
                </button>
            </div>

            {/* Export Preview */}
            {exportData && (
                <div className="card p-6 fade-in">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="font-semibold text-slate-200">Export Preview</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {typeof exportData === 'string'
                                    ? `${exportData.split('\n').length} lines`
                                    : format === 'chunks'
                                        ? `${(exportData as { totalEntries?: number }).totalEntries || 0} entries, ${(exportData as { totalChunks?: number }).totalChunks || 0} chunks`
                                        : `${(exportData as { totalEntries?: number }).totalEntries || 0} entries`
                                }
                            </p>
                        </div>
                        <button
                            onClick={handleDownload}
                            className="btn-primary"
                        >
                            <DownloadIcon />
                            Download {formatLabels[format]}
                        </button>
                    </div>

                    <div className="content-preview">
                        <pre className="text-sm">
                            {typeof exportData === 'string'
                                ? exportData.substring(0, 5000) + (exportData.length > 5000 ? '\n\n... [truncated]' : '')
                                : JSON.stringify(exportData, null, 2).substring(0, 5000) + (JSON.stringify(exportData, null, 2).length > 5000 ? '\n\n... [truncated]' : '')
                            }
                        </pre>
                    </div>
                </div>
            )}

            {/* API Documentation */}
            <div className="mt-8 card p-6 bg-slate-800/50 border-slate-700">
                <div className="flex items-center gap-2 mb-4">
                    <CodeIcon />
                    <h3 className="font-semibold text-slate-200">API Endpoints</h3>
                </div>
                <div className="space-y-3 text-sm">
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <code className="text-teal-400 font-mono text-xs">GET /api/entries</code>
                        <p className="text-slate-400 mt-1">List all KB entries with filter support</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <code className="text-teal-400 font-mono text-xs">GET /api/export?format=chunks&ragStatus=APPROVED</code>
                        <p className="text-slate-400 mt-1">Export chunked data for vector embedding</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                        <code className="text-teal-400 font-mono text-xs">POST /api/entries</code>
                        <p className="text-slate-400 mt-1">Create new KB entry (JSON body)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
