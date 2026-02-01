import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch the URL content
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            return NextResponse.json({
                error: `Failed to fetch URL: ${response.status} ${response.statusText}`
            }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove script, style, nav, footer elements
        $('script, style, nav, footer, header, aside, .sidebar, .menu, .navigation').remove();

        // Extract title
        const title = $('title').text().trim() ||
            $('h1').first().text().trim() ||
            'Untitled';

        // Extract main content - try common content selectors
        let content = '';
        const contentSelectors = [
            'article', 'main', '.content', '.post-content', '.entry-content',
            '.article-body', '.post-body', '#content', '.blog-post'
        ];

        for (const selector of contentSelectors) {
            const el = $(selector);
            if (el.length > 0) {
                content = el.text().trim();
                break;
            }
        }

        // Fallback to body if no content found
        if (!content) {
            content = $('body').text().trim();
        }

        // Clean up whitespace
        content = content
            .replace(/\s+/g, ' ')
            .replace(/\n\s*\n/g, '\n\n')
            .trim();

        // Truncate if too long (for preview)
        const truncatedContent = content.length > 50000
            ? content.substring(0, 50000) + '...'
            : content;

        return NextResponse.json({
            success: true,
            url,
            title,
            content: truncatedContent,
            contentLength: content.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Scrape error:', error);
        return NextResponse.json({
            error: `Scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }, { status: 500 });
    }
}
