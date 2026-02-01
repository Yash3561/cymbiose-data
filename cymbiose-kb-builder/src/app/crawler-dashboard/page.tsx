'use client';

import { useState, useEffect } from 'react';

interface CrawlJob {
    id: string;
    seed_url: string;
    status: string;
    max_depth: number;
    max_urls: number;
    urls_found: number;
    urls_scraped: number;
    urls_failed: number;
    urls_pending: number;
    current_url: string | null;
    started_at: string | null;
    completed_at: string | null;
    scraped_urls: ScrapedUrl[];
    error: string | null;
}

interface ScrapedUrl {
    url: string;
    title: string;
    depth: number;
    quality_score: number;
    content_length?: number;
    error?: string;
    scraped_at: string;
}

// Icon Components
const SpiderIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

const PlayIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
);

const StopIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <rect x="6" y="6" width="12" height="12" rx="1" />
    </svg>
);

const TrashIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

const LinkIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const CRAWLER_API = 'http://localhost:8001';

export default function CrawlerDashboardPage() {
    const [jobs, setJobs] = useState<CrawlJob[]>([]);
    const [loading, setLoading] = useState(false);
    const [showNewJob, setShowNewJob] = useState(false);
    const [newJobForm, setNewJobForm] = useState({
        seed_url: '',
        max_depth: 2,
        max_urls: 30,
        same_domain_only: true
    });
    const [selectedJob, setSelectedJob] = useState<CrawlJob | null>(null);
    const [previewLinks, setPreviewLinks] = useState<string[]>([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    useEffect(() => {
        fetchJobs();
        // Poll for updates every 3 seconds
        const interval = setInterval(fetchJobs, 3000);
        return () => clearInterval(interval);
    }, []);

    async function fetchJobs() {
        try {
            const res = await fetch(`${CRAWLER_API}/crawl/jobs`);
            if (res.ok) {
                const data = await res.json();
                setJobs(data);
                // Update selected job if viewing
                if (selectedJob) {
                    const updated = data.find((j: CrawlJob) => j.id === selectedJob.id);
                    if (updated) setSelectedJob(updated);
                }
            }
        } catch (err) {
            console.error('Failed to fetch jobs:', err);
        }
    }

    async function startCrawl() {
        if (!newJobForm.seed_url) return;

        setLoading(true);
        try {
            const res = await fetch(`${CRAWLER_API}/crawl/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newJobForm)
            });
            if (res.ok) {
                setShowNewJob(false);
                setNewJobForm({ seed_url: '', max_depth: 2, max_urls: 30, same_domain_only: true });
                fetchJobs();
            }
        } catch (err) {
            console.error('Failed to start crawl:', err);
        } finally {
            setLoading(false);
        }
    }

    async function stopJob(jobId: string) {
        try {
            await fetch(`${CRAWLER_API}/crawl/jobs/${jobId}/stop`, { method: 'POST' });
            fetchJobs();
        } catch (err) {
            console.error('Failed to stop job:', err);
        }
    }

    async function deleteJob(jobId: string) {
        try {
            await fetch(`${CRAWLER_API}/crawl/jobs/${jobId}`, { method: 'DELETE' });
            if (selectedJob?.id === jobId) setSelectedJob(null);
            fetchJobs();
        } catch (err) {
            console.error('Failed to delete job:', err);
        }
    }

    async function previewLinks_fn() {
        if (!newJobForm.seed_url) return;

        setLoadingPreview(true);
        try {
            const res = await fetch(
                `${CRAWLER_API}/crawl/discover-links?url=${encodeURIComponent(newJobForm.seed_url)}&same_domain=${newJobForm.same_domain_only}`
            );
            if (res.ok) {
                const data = await res.json();
                setPreviewLinks(data.links || []);
            }
        } catch (err) {
            console.error('Failed to preview links:', err);
        } finally {
            setLoadingPreview(false);
        }
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'running': return 'text-blue-400 bg-blue-500/20';
            case 'completed': return 'text-green-400 bg-green-500/20';
            case 'failed': return 'text-red-400 bg-red-500/20';
            case 'paused': return 'text-yellow-400 bg-yellow-500/20';
            default: return 'text-slate-400 bg-slate-500/20';
        }
    }

    function getProgressPercent(job: CrawlJob) {
        if (job.max_urls === 0) return 0;
        return Math.round((job.urls_scraped / job.max_urls) * 100);
    }

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                        <SpiderIcon />
                        Auto-Crawler Dashboard
                    </h1>
                    <p className="text-slate-400 mt-1">Automatically discover and scrape clinical resources</p>
                </div>
                <button
                    onClick={() => setShowNewJob(true)}
                    className="btn-primary"
                >
                    <PlayIcon />
                    New Crawl Job
                </button>
            </div>

            {/* New Job Modal */}
            {showNewJob && (
                <div className="modal-overlay" onClick={() => setShowNewJob(false)}>
                    <div className="modal-content max-w-2xl" onClick={e => e.stopPropagation()}>
                        <h2 className="text-lg font-semibold text-slate-100 mb-4">Start New Crawl</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Seed URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newJobForm.seed_url}
                                        onChange={e => setNewJobForm({ ...newJobForm, seed_url: e.target.value })}
                                        placeholder="https://www.who.int/health-topics/mental-health"
                                        className="input flex-1"
                                    />
                                    <button
                                        onClick={previewLinks_fn}
                                        disabled={loadingPreview || !newJobForm.seed_url}
                                        className="btn-secondary"
                                    >
                                        {loadingPreview ? <RefreshIcon /> : <LinkIcon />}
                                        Preview
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Max Depth</label>
                                    <select
                                        value={newJobForm.max_depth}
                                        onChange={e => setNewJobForm({ ...newJobForm, max_depth: parseInt(e.target.value) })}
                                        className="input"
                                    >
                                        <option value={1}>1 level</option>
                                        <option value={2}>2 levels</option>
                                        <option value={3}>3 levels</option>
                                        <option value={4}>4 levels</option>
                                        <option value={5}>5 levels</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Max URLs</label>
                                    <select
                                        value={newJobForm.max_urls}
                                        onChange={e => setNewJobForm({ ...newJobForm, max_urls: parseInt(e.target.value) })}
                                        className="input"
                                    >
                                        <option value={10}>10 URLs</option>
                                        <option value={20}>20 URLs</option>
                                        <option value={30}>30 URLs</option>
                                        <option value={50}>50 URLs</option>
                                        <option value={100}>100 URLs</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Domain</label>
                                    <select
                                        value={newJobForm.same_domain_only ? 'same' : 'any'}
                                        onChange={e => setNewJobForm({ ...newJobForm, same_domain_only: e.target.value === 'same' })}
                                        className="input"
                                    >
                                        <option value="same">Same domain only</option>
                                        <option value="any">Follow all links</option>
                                    </select>
                                </div>
                            </div>

                            {/* Link Preview */}
                            {previewLinks.length > 0 && (
                                <div className="bg-slate-800/50 rounded-lg p-4 max-h-40 overflow-y-auto">
                                    <p className="text-sm text-slate-400 mb-2">Found {previewLinks.length} links:</p>
                                    <ul className="text-xs text-slate-500 space-y-1">
                                        {previewLinks.slice(0, 10).map((link, i) => (
                                            <li key={i} className="truncate">{link}</li>
                                        ))}
                                        {previewLinks.length > 10 && (
                                            <li className="text-teal-400">...and {previewLinks.length - 10} more</li>
                                        )}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-700">
                            <button onClick={() => setShowNewJob(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={startCrawl}
                                disabled={loading || !newJobForm.seed_url}
                                className="btn-primary"
                            >
                                {loading ? <RefreshIcon /> : <PlayIcon />}
                                Start Crawl
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Jobs */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">Crawl Jobs</h2>

                    {jobs.length === 0 ? (
                        <div className="card p-8 text-center">
                            <SpiderIcon />
                            <p className="text-slate-500 mt-2">No crawl jobs yet</p>
                            <p className="text-sm text-slate-600">Start a new crawl to discover clinical resources</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {jobs.map(job => (
                                <div
                                    key={job.id}
                                    onClick={() => setSelectedJob(job)}
                                    className={`card p-4 cursor-pointer transition-all ${selectedJob?.id === job.id ? 'ring-2 ring-teal-500' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 min-w-0">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${getStatusColor(job.status)}`}>
                                                {job.status.toUpperCase()}
                                            </span>
                                            <p className="text-sm text-slate-300 mt-1 truncate">{job.seed_url}</p>
                                        </div>
                                        <div className="flex gap-1 ml-2">
                                            {job.status === 'running' && (
                                                <button
                                                    onClick={e => { e.stopPropagation(); stopJob(job.id); }}
                                                    className="icon-btn text-yellow-400 hover:bg-yellow-500/20"
                                                    title="Stop"
                                                >
                                                    <StopIcon />
                                                </button>
                                            )}
                                            <button
                                                onClick={e => { e.stopPropagation(); deleteJob(job.id); }}
                                                className="icon-btn text-red-400 hover:bg-red-500/20"
                                                title="Delete"
                                            >
                                                <TrashIcon />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden mt-3">
                                        <div
                                            className={`h-full transition-all ${job.status === 'running' ? 'bg-blue-500' :
                                                    job.status === 'completed' ? 'bg-green-500' : 'bg-slate-500'
                                                }`}
                                            style={{ width: `${getProgressPercent(job)}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                                        <span>{job.urls_scraped} / {job.max_urls} URLs</span>
                                        <span>Depth: {job.max_depth}</span>
                                    </div>

                                    {job.current_url && job.status === 'running' && (
                                        <p className="text-xs text-blue-400 mt-2 truncate animate-pulse">
                                            🔍 {job.current_url}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Job Details */}
                <div>
                    <h2 className="text-lg font-semibold text-slate-200 mb-4">Scraped URLs</h2>

                    {selectedJob ? (
                        <div className="card p-4">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="text-sm text-slate-400">Job ID: {selectedJob.id}</p>
                                    <p className="text-xs text-slate-500">
                                        {selectedJob.urls_scraped} scraped • {selectedJob.urls_failed} failed • {selectedJob.urls_pending} pending
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {selectedJob.scraped_urls.length === 0 ? (
                                    <p className="text-slate-500 text-center py-4">No URLs scraped yet</p>
                                ) : (
                                    selectedJob.scraped_urls.map((url, i) => (
                                        <div
                                            key={i}
                                            className={`p-3 rounded-lg ${url.error ? 'bg-red-500/10' : 'bg-slate-800/50'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm text-slate-300 truncate flex-1" title={url.title}>
                                                    {url.title}
                                                </p>
                                                {!url.error && (
                                                    <span className="text-xs text-yellow-400 ml-2">
                                                        {'★'.repeat(url.quality_score)}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 truncate mt-1">{url.url}</p>
                                            <div className="flex gap-3 text-xs text-slate-600 mt-1">
                                                <span>Depth: {url.depth}</span>
                                                {url.content_length && <span>{(url.content_length / 1000).toFixed(1)}k chars</span>}
                                                {url.error && <span className="text-red-400">{url.error}</span>}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card p-8 text-center">
                            <p className="text-slate-500">Select a job to view details</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400">
                    <strong className="text-slate-200">How it works:</strong> The crawler starts from your seed URL,
                    discovers all links, and recursively scrapes pages up to the specified depth.
                    Rate-limited to 1 request/second to be respectful to servers.
                </p>
            </div>
        </div>
    );
}
