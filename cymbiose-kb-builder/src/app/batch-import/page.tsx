'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface ImportResult {
    url: string;
    status: 'pending' | 'processing' | 'success' | 'error';
    title?: string;
    error?: string;
    quality_score?: number;
    chunk_count?: number;
}

// Icon Components
const UploadIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const CheckIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const XIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const LoaderIcon = () => (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
);

export default function BatchImportPage() {
    const [urls, setUrls] = useState<string[]>([]);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [textInput, setTextInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseUrls = (text: string): string[] => {
        return text
            .split(/[\n,]/)
            .map(url => url.trim())
            .filter(url => url.startsWith('http'));
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseUrls(text);
            setUrls(parsed);
            setResults(parsed.map(url => ({ url, status: 'pending' })));
        };
        reader.readAsText(file);
    };

    const handleTextSubmit = () => {
        const parsed = parseUrls(textInput);
        setUrls(parsed);
        setResults(parsed.map(url => ({ url, status: 'pending' })));
    };

    const processUrls = async () => {
        setIsProcessing(true);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            // Update status to processing
            setResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'processing' } : r
            ));

            try {
                // Scrape the URL
                const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_CRAWLER_URL || 'http://localhost:8001'}/scrape`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                if (!scrapeResponse.ok) {
                    throw new Error(`Scrape failed: ${scrapeResponse.status}`);
                }

                const scrapeData = await scrapeResponse.json();

                // Save to KB
                const kbId = `WEB_${Date.now().toString(36).toUpperCase()}`;
                const saveResponse = await fetch('/api/entries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        kbId,
                        sourceType: 'BLOG',
                        sourceCategory: 'CYMBIOSE_IP',
                        title: scrapeData.title,
                        urlOrLocation: url,
                        accessType: 'PUBLIC',
                        rawContent: scrapeData.markdown,
                        summary: scrapeData.markdown?.substring(0, 500),
                        tagsModality: scrapeData.suggested_tags?.modality || [],
                        tagsPopulation: scrapeData.suggested_tags?.population || [],
                        tagsRiskLanguage: scrapeData.suggested_tags?.risk_factors || [],
                        tagsCulturalContext: scrapeData.suggested_tags?.cultural_context || [],
                        tagsInterventionCategory: scrapeData.suggested_tags?.intervention_type || [],
                        sourceQualityScore: scrapeData.quality_score,
                        ragInclusionStatus: 'PENDING',
                        addedBy: 'Batch Import'
                    })
                });

                if (!saveResponse.ok) {
                    throw new Error('Save failed');
                }

                setResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: 'success',
                        title: scrapeData.title,
                        quality_score: scrapeData.quality_score,
                        chunk_count: scrapeData.metadata?.chunk_count
                    } : r
                ));

            } catch (error) {
                setResults(prev => prev.map((r, idx) =>
                    idx === i ? {
                        ...r,
                        status: 'error',
                        error: error instanceof Error ? error.message : 'Unknown error'
                    } : r
                ));
            }

            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setIsProcessing(false);
    };

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-100">Batch Import</h1>
                <p className="text-slate-400 mt-1">Import multiple URLs at once with AI tagging</p>
            </div>

            {/* Input Section */}
            {results.length === 0 && (
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    {/* File Upload */}
                    <div
                        className="card p-8 border-2 border-dashed border-slate-600 hover:border-teal-500 transition-colors cursor-pointer text-center"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                        <div className="text-teal-400 mb-4 flex justify-center">
                            <UploadIcon />
                        </div>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Upload File</h3>
                        <p className="text-sm text-slate-400">
                            Drop a CSV or TXT file with URLs (one per line)
                        </p>
                    </div>

                    {/* Text Input */}
                    <div className="card p-6">
                        <h3 className="text-lg font-medium text-slate-200 mb-4">Paste URLs</h3>
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste URLs here, one per line..."
                            className="input min-h-[120px] mb-4 resize-none"
                        />
                        <button
                            onClick={handleTextSubmit}
                            className="btn-primary w-full"
                            disabled={!textInput.trim()}
                        >
                            Parse URLs
                        </button>
                    </div>
                </div>
            )}

            {/* URL List */}
            {results.length > 0 && (
                <div className="card p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-slate-200">
                                {urls.length} URLs Ready
                            </h3>
                            {isProcessing && (
                                <p className="text-sm text-slate-400">Processing...</p>
                            )}
                            {!isProcessing && successCount > 0 && (
                                <p className="text-sm text-emerald-400">
                                    ✓ {successCount} imported, {errorCount} failed
                                </p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            {!isProcessing && successCount === 0 && (
                                <button
                                    onClick={() => {
                                        setResults([]);
                                        setUrls([]);
                                        setTextInput('');
                                    }}
                                    className="btn-secondary"
                                >
                                    Clear
                                </button>
                            )}
                            {!isProcessing && successCount === 0 && (
                                <button
                                    onClick={processUrls}
                                    className="btn-primary"
                                >
                                    Start Import
                                </button>
                            )}
                            {!isProcessing && successCount > 0 && (
                                <Link href="/catalog" className="btn-primary">
                                    View in Catalog →
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {isProcessing && (
                        <div className="h-2 bg-slate-700 rounded-full mb-4 overflow-hidden">
                            <div
                                className="h-full bg-teal-500 transition-all duration-300"
                                style={{
                                    width: `${((successCount + errorCount) / results.length) * 100}%`
                                }}
                            />
                        </div>
                    )}

                    {/* Results List */}
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {results.map((result, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-3 p-3 rounded-lg ${result.status === 'success' ? 'bg-emerald-900/20' :
                                    result.status === 'error' ? 'bg-red-900/20' :
                                        result.status === 'processing' ? 'bg-teal-900/20' :
                                            'bg-slate-800/50'
                                    }`}
                            >
                                {/* Status Icon */}
                                <div className={`flex-shrink-0 ${result.status === 'success' ? 'text-emerald-400' :
                                    result.status === 'error' ? 'text-red-400' :
                                        result.status === 'processing' ? 'text-teal-400' :
                                            'text-slate-500'
                                    }`}>
                                    {result.status === 'success' && <CheckIcon />}
                                    {result.status === 'error' && <XIcon />}
                                    {result.status === 'processing' && <LoaderIcon />}
                                    {result.status === 'pending' && (
                                        <div className="w-4 h-4 rounded-full border-2 border-slate-500" />
                                    )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-slate-300 truncate">
                                        {result.title || result.url}
                                    </p>
                                    {result.error && (
                                        <p className="text-xs text-red-400">{result.error}</p>
                                    )}
                                </div>

                                {/* Metadata */}
                                {result.status === 'success' && (
                                    <div className="flex gap-2 text-xs">
                                        {result.quality_score && (
                                            <span className="text-amber-400">
                                                {'★'.repeat(result.quality_score)}
                                            </span>
                                        )}
                                        {result.chunk_count && (
                                            <span className="text-purple-400">
                                                {result.chunk_count} chunks
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
