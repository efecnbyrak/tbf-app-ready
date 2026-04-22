import fs from 'fs/promises';
import path from 'path';

export interface SearchChunk {
    text: string;
    section: string;
    chunkIndex: number;
    page?: number;
}

const PDF_FILES = {
    kural: "Basketbol Oyun Kuralları 2022.v.1.2.pdf",
    yorum: "Basketbol Oyun Kuralları Resmi Yorumlar.v4.1.pdf",
} as const;

// Module-level cache — persists for the lifetime of the serverless function instance
const chunkCache: Record<string, SearchChunk[]> = {};
const keywordCache: Record<string, string[]> = {};

export function splitIntoChunks(text: string): SearchChunk[] {
    const chunks: SearchChunk[] = [];
    let currentSection = "";
    let chunkIndex = 0;

    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const paragraphs = normalized.split(/\n{2,}/);

    for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed || trimmed.length < 8) continue;

        const isHeader =
            /^KURAL\s+\d+/i.test(trimmed) ||
            /^\d+\s+[A-ZÜŞÇÖĞIIH].{5,}/i.test(trimmed) ||
            (trimmed.length < 80 && /^[A-ZÜŞÇÖĞİI\s\d.,\-]+$/.test(trimmed) && trimmed.length > 5);

        if (isHeader) {
            currentSection = trimmed.slice(0, 100);
        }

        if (trimmed.length > 450) {
            const words = trimmed.split(/\s+/);
            let buffer: string[] = [];

            for (const word of words) {
                buffer.push(word);
                if (buffer.join(' ').length >= 350) {
                    const chunkText = buffer.join(' ');
                    if (chunkText.trim().length >= 20) {
                        chunks.push({ text: chunkText.trim(), section: currentSection, chunkIndex: chunkIndex++ });
                    }
                    buffer = buffer.slice(-20);
                }
            }
            if (buffer.length > 5) {
                chunks.push({ text: buffer.join(' ').trim(), section: currentSection, chunkIndex: chunkIndex++ });
            }
        } else {
            chunks.push({ text: trimmed, section: currentSection, chunkIndex: chunkIndex++ });
        }
    }

    return chunks;
}

export async function getPdfChunks(type: keyof typeof PDF_FILES): Promise<SearchChunk[]> {
    if (chunkCache[type]) return chunkCache[type];

    // ── Primary path: pre-extracted JSON (generated at build time) ──
    try {
        const jsonPath = path.join(process.cwd(), 'public', 'pdf-data', `${type}.json`);
        const raw = await fs.readFile(jsonPath, 'utf-8');
        const chunks = JSON.parse(raw) as SearchChunk[];
        if (chunks.length > 0) {
            chunkCache[type] = chunks;
            return chunks;
        }
    } catch {
        // JSON not found — fall through to runtime parsing
    }

    // ── Fallback: runtime PDF parsing (local dev only) ──
    const filename = PDF_FILES[type];
    const filePath = path.join(process.cwd(), 'data', 'gameRules', filename);

    try {
        const buffer = await fs.readFile(filePath);
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs') as any;
        const uint8 = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true });
        const pdf = await loadingTask.promise;

        const allChunks: SearchChunk[] = [];
        let chunkIndex = 0;
        let currentSection = '';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const content = await page.getTextContent();
            let pageText = '';
            let lastY: number | null = null;
            for (const item of content.items) {
                if (!('str' in item)) continue;
                const y: number = (item as any).transform[5];
                if (lastY !== null && Math.abs(y - lastY) > 5) pageText += '\n';
                pageText += (item as any).str;
                if ((item as any).hasEOL) pageText += '\n';
                lastY = y;
            }

            const normalized = pageText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            const paragraphs = normalized.split(/\n{2,}/);

            for (const para of paragraphs) {
                const trimmed = para.trim();
                if (!trimmed || trimmed.length < 8) continue;

                const isHeader =
                    /^KURAL\s+\d+/i.test(trimmed) ||
                    /^\d+\s+[A-ZÜŞÇÖĞIIH].{5,}/i.test(trimmed) ||
                    (trimmed.length < 80 && /^[A-ZÜŞÇÖĞİI\s\d.,\-]+$/.test(trimmed) && trimmed.length > 5);

                if (isHeader) {
                    currentSection = trimmed.slice(0, 100);
                }

                if (trimmed.length > 450) {
                    const words = trimmed.split(/\s+/);
                    let buffer: string[] = [];
                    for (const word of words) {
                        buffer.push(word);
                        if (buffer.join(' ').length >= 350) {
                            const chunkText = buffer.join(' ');
                            if (chunkText.trim().length >= 20) {
                                allChunks.push({ text: chunkText.trim(), section: currentSection, chunkIndex: chunkIndex++, page: pageNum });
                            }
                            buffer = buffer.slice(-20);
                        }
                    }
                    if (buffer.length > 5) {
                        allChunks.push({ text: buffer.join(' ').trim(), section: currentSection, chunkIndex: chunkIndex++, page: pageNum });
                    }
                } else {
                    allChunks.push({ text: trimmed, section: currentSection, chunkIndex: chunkIndex++, page: pageNum });
                }
            }
        }

        chunkCache[type] = allChunks;
        return allChunks;
    } catch (e: any) {
        console.error(`[PDF Rules Cache] Failed to parse ${filename}:`, e?.message);
        return [];
    }
}

export async function getKeywords(type: keyof typeof PDF_FILES): Promise<string[]> {
    if (keywordCache[type]) return keywordCache[type];

    const chunks = await getPdfChunks(type);
    const freq: Record<string, number> = {};
    const stop = new Set(['ve', 'veya', 'ile', 'bir', 'bu', 'da', 'de', 'den', 'dan',
        'için', 'olan', 'olarak', 'ise', 'her', 'çok', 'daha', 'olan', 'gibi',
        'sonra', 'önce', 'kadar', 'olduğunda', 'oyun', 'top', 'oyuncu']);

    for (const chunk of chunks) {
        const words = chunk.text.toLowerCase().split(/[\s.,;:()\[\]"'!?]+/);
        for (const w of words) {
            if (w.length >= 4 && !stop.has(w) && /^[a-züşçöğiıa-z]+$/.test(w)) {
                freq[w] = (freq[w] || 0) + 1;
            }
        }
    }

    const keywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 200)
        .map(([w]) => w);

    keywordCache[type] = keywords;
    return keywords;
}
