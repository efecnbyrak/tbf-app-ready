/**
 * Regenerates public/pdf-data/kural.json and yorum.json with page numbers.
 * Run: node scripts/generate-pdf-data.mjs
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const PDF_FILES = {
    kural: "Basketbol Oyun Kuralları 2022.v.1.2.pdf",
    yorum: "Basketbol Oyun Kuralları Resmi Yorumlar.v4.1.pdf",
};

async function generateChunks(type) {
    const filename = PDF_FILES[type];
    const filePath = path.join(ROOT, 'data', 'gameRules', filename);
    console.log(`Processing ${filename}...`);

    const pdfjsModule = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const pdfjsLib = pdfjsModule.default ?? pdfjsModule;
    const buffer = await fs.readFile(filePath);
    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data: uint8, useSystemFonts: true });
    const pdf = await loadingTask.promise;
    console.log(`  Pages: ${pdf.numPages}`);

    const allChunks = [];
    let chunkIndex = 0;
    let currentSection = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        let pageText = '';
        let lastY = null;
        for (const item of content.items) {
            if (!('str' in item)) continue;
            const y = item.transform[5];
            if (lastY !== null && Math.abs(y - lastY) > 5) pageText += '\n';
            pageText += item.str;
            if (item.hasEOL) pageText += '\n';
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
                let buf = [];
                for (const word of words) {
                    buf.push(word);
                    if (buf.join(' ').length >= 350) {
                        const chunkText = buf.join(' ');
                        if (chunkText.trim().length >= 20) {
                            allChunks.push({ text: chunkText.trim(), section: currentSection, chunkIndex: chunkIndex++, page: pageNum });
                        }
                        buf = buf.slice(-20);
                    }
                }
                if (buf.length > 5) {
                    allChunks.push({ text: buf.join(' ').trim(), section: currentSection, chunkIndex: chunkIndex++, page: pageNum });
                }
            } else {
                allChunks.push({ text: trimmed, section: currentSection, chunkIndex: chunkIndex++, page: pageNum });
            }
        }
    }

    console.log(`  Chunks: ${allChunks.length}`);
    const outPath = path.join(ROOT, 'public', 'pdf-data', `${type}.json`);
    await fs.writeFile(outPath, JSON.stringify(allChunks), 'utf-8');
    console.log(`  Written to ${outPath}`);
}

(async () => {
    await generateChunks('kural');
    await generateChunks('yorum');
    console.log('Done!');
})();
