'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface ContentChunk {
    index: number;
    content: string;
    token_estimate: number;
    heading?: string;
}

interface ScrapeData {
    url: string;
    title: string;
    markdown: string;
    chunks?: ContentChunk[];
    quality_score?: number;
    quality_reason?: string;
    suggested_tags?: {
        modality?: string[];
        population?: string[];
        risk_factors?: string[];
        cultural_context?: string[];
        intervention_type?: string[];
    };
    metadata?: {
        content_length?: number;
        status_code?: number;
        raw_html_size?: number;
        chunk_count?: number;
        ai_tagged?: boolean;
    };
}

// Icon Components
const SearchIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const LoaderIcon = () => (
    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
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

const ExternalLinkIcon = () => (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

export default function ScraperPage() {
    const searchParams = useSearchParams();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [scrapedData, setScrapedData] = useState<ScrapeData | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill URL from query parameter (from seed URLs page)
    useEffect(() => {
        const urlParam = searchParams.get('url');
        if (urlParam) {
            setUrl(urlParam);
        }
    }, [searchParams]);

    const handleScrape = async () => {
        if (!url.trim()) return;

        setIsLoading(true);
        setScrapedData(null);
        setError(null);

        try {
            const response = await fetch('http://localhost:8001/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                throw new Error(errorData.detail || `Request failed: ${response.status}`);
            }

            const data = await response.json();
            setScrapedData(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to scrape URL';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isLoading) {
            handleScrape();
        }
    };

    const handleSaveToKB = async () => {
        if (!scrapedData) return;

        setIsSaving(true);
        setSaveSuccess(false);

        try {
            // Generate a KB ID from the title
            const kbId = `WEB_${Date.now().toString(36).toUpperCase()}`;

            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    kbId,
                    sourceType: 'BLOG',
                    sourceCategory: 'CYMBIOSE_IP',
                    title: scrapedData.title,
                    urlOrLocation: scrapedData.url,
                    accessType: 'PUBLIC',
                    rawContent: scrapedData.markdown,
                    summary: scrapedData.markdown?.substring(0, 500),
                    tagsModality: scrapedData.suggested_tags?.modality || [],
                    tagsPopulation: scrapedData.suggested_tags?.population || [],
                    tagsRiskLanguage: scrapedData.suggested_tags?.risk_factors || [],
                    tagsCulturalContext: scrapedData.suggested_tags?.cultural_context || [],
                    tagsInterventionCategory: scrapedData.suggested_tags?.intervention_type || [],
                    ragInclusionStatus: 'PENDING',
                    addedBy: 'URL Scraper'
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save entry');
            }

            setSaveSuccess(true);
            setTimeout(() => {
                setScrapedData(null);
                setUrl('');
                setSaveSuccess(false);
            }, 2000);

        } catch (err) {
            console.error('Save error:', err);
            setError('Failed to save to knowledge base');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-slate-100">URL Scraper</h1>
                <p className="text-slate-400 mt-1">Extract clean content from clinical websites</p>
            </div>

            {/* Search Input */}
            <div className="card p-6 mb-6">
                <div className="flex gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Enter URL to scrape (e.g., https://healthline.com/health/...)"
                            className="input pl-4 pr-4"
                        />
                    </div>
                    <button
                        onClick={handleScrape}
                        disabled={isLoading || !url.trim()}
                        className="btn-primary min-w-[140px]"
                    >
                        {isLoading ? (
                            <>
                                <LoaderIcon />
                                Scraping...
                            </>
                        ) : (
                            <>
                                <SearchIcon />
                                Scrape URL
                            </>
                        )}
                    </button>
                </div>

                {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}
            </div>

            {/* Results */}
            {scrapedData && (
                <div className="card p-6 fade-in">
                    {/* Title & URL */}
                    <div className="border-b border-slate-700 pb-4 mb-6">
                        <h2 className="text-xl font-semibold text-slate-100">{scrapedData.title}</h2>
                        <a
                            href={scrapedData.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-teal-400 hover:text-teal-300 mt-1"
                        >
                            {scrapedData.url}
                            <ExternalLinkIcon />
                        </a>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        {/* Quality Score */}
                        {scrapedData.quality_score && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg" title={scrapedData.quality_reason}>
                                <span className="text-xs text-slate-400 uppercase">Quality</span>
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                            key={star}
                                            className={`w-4 h-4 ${star <= scrapedData.quality_score! ? 'text-amber-400' : 'text-slate-600'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Chunk Count */}
                        {scrapedData.metadata?.chunk_count && (
                            <div className="badge bg-purple-600/20 text-purple-300 border border-purple-500/30">
                                📦 {scrapedData.metadata.chunk_count} chunks
                            </div>
                        )}

                        {/* Character Count */}
                        {scrapedData.metadata?.content_length && (
                            <div className="badge badge-success">
                                {scrapedData.metadata.content_length.toLocaleString()} chars
                            </div>
                        )}

                        {/* HTTP Status */}
                        <div className="badge bg-slate-700 text-slate-300">
                            HTTP {scrapedData.metadata?.status_code}
                        </div>
                    </div>

                    {/* AI Suggested Tags */}
                    <div className="bg-slate-800/50 rounded-lg p-5 mb-6">
                        <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                            <h3 className="text-sm font-semibold text-teal-400 uppercase tracking-wider">
                                AI Suggested Tags (Gemini)
                            </h3>
                            {scrapedData.metadata?.ai_tagged && (
                                <span className="badge badge-success text-xs">AI Powered</span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            <TagColumn
                                label="Modality"
                                tags={scrapedData.suggested_tags?.modality || []}
                                colorClass="tag-modality"
                            />
                            <TagColumn
                                label="Population"
                                tags={scrapedData.suggested_tags?.population || []}
                                colorClass="tag-population"
                            />
                            <TagColumn
                                label="Risk Factors"
                                tags={scrapedData.suggested_tags?.risk_factors || []}
                                colorClass="tag-risk"
                            />
                            <TagColumn
                                label="Cultural"
                                tags={scrapedData.suggested_tags?.cultural_context || []}
                                colorClass="tag-cultural"
                            />
                            <TagColumn
                                label="Intervention"
                                tags={scrapedData.suggested_tags?.intervention_type || []}
                                colorClass="tag-modality"
                            />
                        </div>
                        {!scrapedData.suggested_tags?.modality?.length &&
                            !scrapedData.suggested_tags?.population?.length &&
                            !scrapedData.suggested_tags?.risk_factors?.length && (
                                <p className="text-sm text-slate-500 italic mt-4">
                                    No tags extracted. Make sure GEMINI_API_KEY is configured in the crawler .env file.
                                </p>
                            )}
                    </div>

                    {/* Content Preview */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                            Extracted Content
                        </h3>
                        <div className="content-preview">
                            {scrapedData.markdown || 'No content extracted'}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
                        <button
                            onClick={() => {
                                setScrapedData(null);
                                setSaveSuccess(false);
                            }}
                            className="btn-secondary"
                            disabled={isSaving}
                        >
                            <XIcon />
                            Discard
                        </button>
                        <button
                            onClick={handleSaveToKB}
                            disabled={isSaving || saveSuccess}
                            className={`btn-primary ${saveSuccess ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
                        >
                            {isSaving ? (
                                <>
                                    <LoaderIcon />
                                    Saving...
                                </>
                            ) : saveSuccess ? (
                                <>
                                    <CheckIcon />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <CheckIcon />
                                    Save to KB
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!scrapedData && !isLoading && (
                <div className="card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-slate-700">Enter a URL to scrape</h3>
                    <p className="text-slate-500 mt-1">
                        Extract clean markdown content from any clinical website
                    </p>
                </div>
            )}
        </div>
    );
}

function TagColumn({ label, tags, colorClass }: { label: string; tags: string[]; colorClass: string }) {
    return (
        <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-2">
                {label}
            </span>
            <div className="flex flex-wrap gap-2">
                {tags.length > 0 ? (
                    tags.map(tag => (
                        <span key={tag} className={`tag ${colorClass}`}>{tag}</span>
                    ))
                ) : (
                    <span className="text-xs text-slate-300">—</span>
                )}
            </div>
        </div>
    );
}
