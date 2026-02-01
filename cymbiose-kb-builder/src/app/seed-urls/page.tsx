'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SeedUrl {
    id: string;
    name: string;
    url: string;
    category: string;
    lastScraped: string | null;
}

// Static seed URLs for clinical sources
const DEFAULT_SEEDS: SeedUrl[] = [
    { id: '1', name: 'WHO Mental Health', url: 'https://www.who.int/health-topics/mental-health', category: 'Guidelines', lastScraped: null },
    { id: '2', name: 'APA Practice Guidelines', url: 'https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines', category: 'Guidelines', lastScraped: null },
    { id: '3', name: 'NIMH Research Topics', url: 'https://www.nimh.nih.gov/health/topics', category: 'Research', lastScraped: null },
    { id: '4', name: 'CDC Mental Health', url: 'https://www.cdc.gov/mentalhealth/', category: 'Public Health', lastScraped: null },
    { id: '5', name: 'SAMHSA Resources', url: 'https://www.samhsa.gov/mental-health', category: 'Resources', lastScraped: null },
];

const GlobeIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const PlusIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

const ScrapeIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path d="M9 12l2 2 4-4" />
    </svg>
);

export default function SeedUrlsPage() {
    const [seeds, setSeeds] = useState<SeedUrl[]>(DEFAULT_SEEDS);
    const [newUrl, setNewUrl] = useState({ name: '', url: '', category: 'Guidelines' });
    const [showAdd, setShowAdd] = useState(false);
    const [scraping, setScraping] = useState<string | null>(null);

    const handleAdd = () => {
        if (!newUrl.name || !newUrl.url) return;
        const seed: SeedUrl = {
            id: Date.now().toString(),
            name: newUrl.name,
            url: newUrl.url,
            category: newUrl.category,
            lastScraped: null
        };
        setSeeds([...seeds, seed]);
        setNewUrl({ name: '', url: '', category: 'Guidelines' });
        setShowAdd(false);
    };

    const handleDelete = (id: string) => {
        setSeeds(seeds.filter(s => s.id !== id));
    };

    const handleScrape = async (seed: SeedUrl) => {
        setScraping(seed.id);
        // Navigate to scraper with pre-filled URL
        window.location.href = `/scraper?url=${encodeURIComponent(seed.url)}`;
    };

    const categories = [...new Set(seeds.map(s => s.category))];

    return (
        <div className="p-8 fade-in">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Seed URLs</h1>
                    <p className="text-slate-400 mt-1">Manage trusted clinical sources for quick scraping</p>
                </div>
                <button
                    onClick={() => setShowAdd(!showAdd)}
                    className="btn-primary"
                >
                    <PlusIcon />
                    Add Source
                </button>
            </div>

            {/* Add Form */}
            {showAdd && (
                <div className="card p-6 mb-6 fade-in">
                    <h3 className="font-semibold text-slate-200 mb-4">Add New Seed URL</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <input
                            type="text"
                            placeholder="Source name"
                            value={newUrl.name}
                            onChange={e => setNewUrl({ ...newUrl, name: e.target.value })}
                            className="input"
                        />
                        <input
                            type="url"
                            placeholder="https://..."
                            value={newUrl.url}
                            onChange={e => setNewUrl({ ...newUrl, url: e.target.value })}
                            className="input"
                        />
                        <select
                            value={newUrl.category}
                            onChange={e => setNewUrl({ ...newUrl, category: e.target.value })}
                            className="input"
                        >
                            <option value="Guidelines">Guidelines</option>
                            <option value="Research">Research</option>
                            <option value="Public Health">Public Health</option>
                            <option value="Resources">Resources</option>
                            <option value="Academic">Academic</option>
                        </select>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleAdd} className="btn-primary">Add Source</button>
                        <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                    </div>
                </div>
            )}

            {/* Sources by Category */}
            {categories.map(category => (
                <div key={category} className="mb-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{category}</h3>
                    <div className="grid grid-cols-1 gap-3">
                        {seeds.filter(s => s.category === category).map(seed => (
                            <div key={seed.id} className="card p-4 flex items-center justify-between hover:border-teal-500/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center">
                                        <GlobeIcon />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-200">{seed.name}</h4>
                                        <p className="text-xs text-slate-500 truncate max-w-md">{seed.url}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleScrape(seed)}
                                        disabled={scraping === seed.id}
                                        className="btn-primary text-sm px-3 py-1.5"
                                    >
                                        <ScrapeIcon />
                                        {scraping === seed.id ? 'Loading...' : 'Scrape'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(seed.id)}
                                        className="btn-secondary text-sm px-3 py-1.5 hover:bg-red-500/20 hover:border-red-500/50"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Help Text */}
            <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-400">
                    <strong className="text-slate-200">Tip:</strong> Add trusted clinical sources here for quick access.
                    Click "Scrape" to open the URL Scraper with the source pre-filled.
                </p>
            </div>
        </div>
    );
}
