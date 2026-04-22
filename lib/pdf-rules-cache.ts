import fs from 'fs/promises';
import path from 'path';

export interface SearchChunk {
    text: string;
    section: string;
    chunkIndex: number;
}

const PDF_FILES = {
    kural: "Basketbol Oyun Kuralları 2022.v.1.2.pdf",
    yorum: "Basketbol Oyun Kuralları Resmi Yorumlar.v4.1.pdf",
} as const;

// Module-level cache — persists for the lifetime of the serverless function instance
const chunkCache: Record<string, SearchChunk[]> = {};
const keywordCache: Record<string, string[]> = {};

function splitIntoChunks(text: string): SearchChunk[] {
    const chunks: SearchChunk[] = [];
    let currentSection = "";
    let chunkIndex = 0;

    // Normalize whitespace
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Split by double newlines (paragraphs)
    const paragraphs = normalized.split(/\n{2,}/);

    for (const para of paragraphs) {
        const trimmed = para.trim();
        if (!trimmed || trimmed.length < 8) continue;

        // Detect section headers (KURAL X, numbered rules like "1.", "1.1", ALL_CAPS lines)
        const isHeader =
            /^KURAL\s+\d+/i.test(trimmed) ||
            /^\d+\s+[A-ZÜŞÇÖĞIIH].{5,}/i.test(trimmed) ||
            (trimmed.length < 80 && /^[A-ZÜŞÇÖĞII\s\d.,\-]+$/.test(trimmed) && trimmed.length > 5);

        if (isHeader) {
            currentSection = trimmed.slice(0, 100);
        }

        // For longer paragraphs, split into overlapping chunks
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
                    // Overlap: keep last 20 words
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

    const filename = PDF_FILES[type];
    const filePath = path.join(process.cwd(), 'data', 'gameRules', filename);

    try {
        const buffer = await fs.readFile(filePath);
        // Dynamic import to use serverExternalPackages config
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse: (buf: Buffer) => Promise<{ text: string; numpages: number }> = require('pdf-parse');
        const data = await pdfParse(buffer);
        const chunks = splitIntoChunks(data.text);
        chunkCache[type] = chunks;
        return chunks;
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
