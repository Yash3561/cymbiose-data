'use client';

import { useState } from 'react';

export default function KBBuilder() {
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [scrapedData, setScrapedData] = useState<any>(null);

    const handleScrape = async () => {
        setIsLoading(true);
        setScrapedData(null);

        try {
            console.log('Sending request to crawler...');
            const response = await fetch('http://localhost:8001/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url }),
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Scraping failed: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log('Scraped data:', data);
            setScrapedData(data);
        } catch (error: any) {
            console.error('Fetch error:', error);
            alert(`Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-slate-800">KB Builder (Crawl4AI)</h1>

            <div className="flex gap-4 mb-8">
                <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/clinical-article"
                    className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                />
                <button
                    onClick={handleScrape}
                    disabled={isLoading}
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium"
                >
                    {isLoading ? 'Crawling & Analyzing...' : '🕷️ Smart Scrape'}
                </button>
            </div>

            {scrapedData && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">

                    {/* Header */}
                    <div className="border-b pb-4">
                        <h2 className="text-xl font-semibold text-slate-800">{scrapedData.title}</h2>
                        <a href={scrapedData.url} target="_blank" className="text-sm text-teal-600 hover:underline">{scrapedData.url}</a>
                    </div>

                    {/* AI Suggested Tags */}
                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">AI Suggested Tags</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">MODALITY</span>
                                <div className="flex flex-wrap gap-2">
                                    {scrapedData.suggested_tags?.modality?.map((tag: string) => (
                                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">POPULATION</span>
                                <div className="flex flex-wrap gap-2">
                                    {scrapedData.suggested_tags?.population?.map((tag: string) => (
                                        <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <span className="text-xs font-semibold text-slate-400 block mb-1">RISK FACTORS</span>
                                <div className="flex flex-wrap gap-2">
                                    {scrapedData.suggested_tags?.risk_factors?.map((tag: string) => (
                                        <span key={tag} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Preview */}
                    <div>
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">Clean Markdown Content</h3>
                        <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto whitespace-pre-wrap">
                            {scrapedData.markdown}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            onClick={() => setScrapedData(null)}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            Discard
                        </button>
                        <button className="px-4 py-2 bg-teal-600 text-white hover:bg-teal-700 rounded-lg">
                            ✅ Save to KB
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
