import { NextRequest, NextResponse } from 'next/server';
import { getPdfChunks, getKeywords, SearchChunk } from '@/lib/pdf-rules-cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cached Fuse instances (persist per function instance)
const fuseCache: Record<string, any> = {};

async function getFuse(type: 'kural' | 'yorum') {
    if (fuseCache[type]) return fuseCache[type];
    const chunks = await getPdfChunks(type);
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(chunks, {
        keys: [
            { name: 'text', weight: 0.7 },
            { name: 'section', weight: 0.3 },
        ],
        threshold: 0.38,
        includeScore: true,
        includeMatches: true,
        minMatchCharLength: 2,
        ignoreLocation: true,
        findAllMatches: true,
        useExtendedSearch: false,
    });
    fuseCache[type] = fuse;
    return fuse;
}

function generateSuggestions(query: string, keywords: string[], limit = 6): string[] {
    const q = query.toLowerCase();
    const exact: string[] = [];
    const partial: string[] = [];

    for (const kw of keywords) {
        if (kw === q) continue;
        if (kw.startsWith(q)) exact.push(kw);
        else if (kw.includes(q)) partial.push(kw);
        if (exact.length + partial.length >= limit * 2) break;
    }

    return [...exact, ...partial].slice(0, limit);
}

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get('q')?.trim() || '';
    const type = (req.nextUrl.searchParams.get('type') || 'kural') as 'kural' | 'yorum';

    if (!q || q.length < 2) {
        return NextResponse.json({ results: [], suggestions: [] });
    }

    try {
        const [fuse, keywords] = await Promise.all([
            getFuse(type),
            getKeywords(type),
        ]);

        const fuseResults = fuse.search(q, { limit: 12 });

        const results = fuseResults.map((r: { item: SearchChunk; score?: number }) => ({
            text: r.item.text,
            section: r.item.section,
            chunkIndex: r.item.chunkIndex,
            score: r.score ?? 1,
            page: r.item.page,
        }));

        const suggestions = generateSuggestions(q, keywords);

        return NextResponse.json({ results, suggestions }, {
            headers: { 'Cache-Control': 'private, max-age=30' }
        });
    } catch (e: any) {
        console.error('[pdf-search] Error:', e?.message);
        return NextResponse.json({ results: [], suggestions: [], error: 'Arama yapılamadı' }, { status: 500 });
    }
}
