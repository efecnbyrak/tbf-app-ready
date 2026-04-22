/**
 * Build-time script: PDF'lerden metin çıkarır ve public/pdf-data/*.json olarak kaydeder.
 * Çalıştırma: tsx scripts/extract-pdf-text.ts
 * Bu script next build öncesinde otomatik çalışır (package.json "build" scripti).
 */

import fs from 'fs/promises';
import path from 'path';

interface SearchChunk {
    text: string;
    section: string;
    chunkIndex: number;
}

const PDF_FILES: Record<string, string> = {
    kural: "Basketbol Oyun Kuralları 2022.v.1.2.pdf",
    yorum: "Basketbol Oyun Kuralları Resmi Yorumlar.v4.1.pdf",
};

function splitIntoChunks(text: string): SearchChunk[] {
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

async function extractTextWithPdfjs(buffer: Buffer): Promise<string> {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs') as any;
    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true });
    const pdf = await loadingTask.promise;

    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();

        let pageText = '';
        let lastY: number | null = null;

        for (const item of content.items) {
            if (!('str' in item)) continue;
            const y: number = item.transform[5];
            if (lastY !== null && Math.abs(y - lastY) > 5) {
                pageText += '\n';
            }
            pageText += item.str;
            if (item.hasEOL) pageText += '\n';
            lastY = y;
        }

        fullText += pageText + '\n\n';
    }

    return fullText;
}

async function main() {
    const outDir = path.join(process.cwd(), 'public', 'pdf-data');
    await fs.mkdir(outDir, { recursive: true });

    console.log('[PDF Extract] Starting PDF text extraction...');

    for (const [type, filename] of Object.entries(PDF_FILES)) {
        const pdfPath = path.join(process.cwd(), 'data', 'gameRules', filename);
        const outPath = path.join(outDir, `${type}.json`);

        try {
            await fs.access(pdfPath);
        } catch {
            console.warn(`[PDF Extract] PDF not found: ${pdfPath} — skipping`);
            await fs.writeFile(outPath, '[]', 'utf-8');
            continue;
        }

        try {
            console.log(`[PDF Extract] Parsing: ${filename}`);
            const buffer = await fs.readFile(pdfPath);
            const text = await extractTextWithPdfjs(buffer);
            const chunks = splitIntoChunks(text);
            await fs.writeFile(outPath, JSON.stringify(chunks), 'utf-8');

            console.log(`[PDF Extract] ✓ ${type}: ${chunks.length} chunks → ${outPath}`);
        } catch (e: any) {
            console.error(`[PDF Extract] ✗ ${type}: ${e?.message}`);
            await fs.writeFile(outPath, '[]', 'utf-8');
        }
    }

    console.log('[PDF Extract] Done.');
}

main().catch(e => {
    console.error('[PDF Extract] Fatal:', e);
    process.exit(0); // Don't fail the build
});
