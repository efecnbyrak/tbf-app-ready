// scripts/build-rules-json.js
// Reads public/pdf-data/{kural,yorum}.json and outputs public/rules-data/{kural,yorum}-structured.json
// Run: node scripts/build-rules-json.js

const fs = require('fs');
const path = require('path');

// Madde X Title
const MADDE_RE = /^Madde\s+(\d+)\s+(.+)/i;
// Sub-article like 8.1, 8.1.2 etc — starts with digits
const SUBID_RE = /^(\d+\.\d+(?:\.\d+)*)\s+(.*)/;
// Bullet lines (•)
const BULLET_RE = /^[•\-]\s+(.+)/;
// Skip these noise patterns
const NOISE_RE = /^(BASKETBOL OYUN KURALLARI|TÜRKİYE BASKETBOL FEDERASYONU|Temmuz 2023|www\.|tbf@|Telefon|Fax|E-posta|Web|Başkan|Genel Sekreter|MHK|Kuruluş|Ankara|İstanbul|Hipodrom|Ataköy|Sinan)/i;

function processChunks(chunks) {
    const articles = [];
    let currentArticle = null;
    let currentSection = null; // subsection like "8.1 Tanım"

    function pushCurrentSection() {
        if (currentSection && currentArticle) {
            currentArticle.sections.push(currentSection);
            currentSection = null;
        }
    }

    function pushCurrentArticle() {
        pushCurrentSection();
        if (currentArticle && (currentArticle.sections.length > 0 || currentArticle.intro.length > 0)) {
            articles.push(currentArticle);
        }
        currentArticle = null;
    }

    for (const chunk of chunks) {
        const text = chunk.text.trim();
        if (!text || text.length < 5) continue;
        if (NOISE_RE.test(text)) continue;
        // Skip page number lines like "Temmuz 2023 TÜRKİYE ... 18"
        if (/^\d+$/.test(text)) continue;
        if (/TÜRKİYE BASKETBOL FEDERASYONU \d+$/.test(text)) continue;

        const maddeMatch = text.match(MADDE_RE);
        if (maddeMatch) {
            pushCurrentArticle();
            currentArticle = {
                id: maddeMatch[1],
                title: maddeMatch[2].trim(),
                page: chunk.page || 0,
                intro: [],
                sections: [],
            };
            continue;
        }

        if (!currentArticle) continue;

        const subMatch = text.match(SUBID_RE);
        if (subMatch) {
            const subId = subMatch[1];
            const rest = subMatch[2].trim();

            // Determine if this is a section header (X.Y) or a paragraph (X.Y.Z)
            const dotCount = (subId.match(/\./g) || []).length;

            if (dotCount === 1) {
                // Section header like "8.1 Tanım" or "8.1 Some text"
                // Check if rest is a short title or a full paragraph
                if (rest.length < 80 && !/[a-z]{10,}/.test(rest.toLowerCase().replace(/[üşçöğiı]/g, 'x'))) {
                    // Likely a title
                    pushCurrentSection();
                    currentSection = { id: subId, title: rest, paragraphs: [] };
                } else {
                    // Long text — it's a paragraph under a section
                    if (!currentSection) {
                        pushCurrentSection();
                        currentSection = { id: subId, title: '', paragraphs: [] };
                    }
                    currentSection.paragraphs.push(`${subId} ${rest}`);
                }
            } else {
                // Numbered paragraph like 8.1.1, 8.1.2
                const para = rest ? `${subId} ${rest}` : subId;
                if (currentSection) {
                    currentSection.paragraphs.push(para);
                } else {
                    // No current section — create implied one
                    currentSection = { id: subId.split('.').slice(0,2).join('.'), title: '', paragraphs: [para] };
                }
            }
            continue;
        }

        // Regular paragraph or bullet
        if (currentSection) {
            currentSection.paragraphs.push(text);
        } else if (currentArticle) {
            currentArticle.intro.push(text);
        }
    }

    pushCurrentArticle();
    return articles;
}

function buildSearchIndex(articles) {
    // Flat search index for Fuse.js
    const index = [];
    for (const art of articles) {
        // Add article-level entry
        const allText = [
            ...art.intro,
            ...art.sections.flatMap(s => [s.title, ...s.paragraphs])
        ].join(' ');

        index.push({
            madde: art.id,
            maddeTitle: art.title,
            sectionId: '',
            sectionTitle: '',
            text: allText.slice(0, 500),
            page: art.page,
        });

        for (const sec of art.sections) {
            const secText = [sec.title, ...sec.paragraphs].join(' ');
            index.push({
                madde: art.id,
                maddeTitle: art.title,
                sectionId: sec.id,
                sectionTitle: sec.title,
                text: secText.slice(0, 500),
                page: art.page,
            });
        }
    }
    return index;
}

for (const type of ['kural', 'yorum']) {
    const inputPath = path.join(__dirname, '..', 'public', 'pdf-data', `${type}.json`);
    if (!fs.existsSync(inputPath)) {
        console.warn(`Skipping ${type} — file not found`);
        continue;
    }

    const chunks = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
    const articles = processChunks(chunks);
    const searchIndex = buildSearchIndex(articles);

    const outDir = path.join(__dirname, '..', 'public', 'rules-data');
    fs.mkdirSync(outDir, { recursive: true });

    // Deduplicate: if same madde appears multiple times keep the one with most content (from TOC vs real content)
    const deduped = [];
    const seen = new Map();
    for (const art of articles) {
        const key = art.id;
        if (!seen.has(key)) {
            seen.set(key, art);
        } else {
            const existing = seen.get(key);
            const existingScore = existing.sections.length * 10 + existing.intro.length;
            const newScore = art.sections.length * 10 + art.intro.length;
            if (newScore > existingScore) {
                seen.set(key, art);
            }
        }
    }
    // Sort by numeric id
    const finalArticles = Array.from(seen.values()).sort((a, b) => parseInt(a.id) - parseInt(b.id));

    fs.writeFileSync(
        path.join(outDir, `${type}-articles.json`),
        JSON.stringify(finalArticles, null, 2)
    );
    const finalSearchIndex = buildSearchIndex(finalArticles);
    fs.writeFileSync(
        path.join(outDir, `${type}-search.json`),
        JSON.stringify(finalSearchIndex, null, 2)
    );

    console.log(`[${type}] ${finalArticles.length} articles, ${finalSearchIndex.length} search entries`);
    if (articles.length > 0) {
        console.log(`  First: Madde ${articles[0].id} — ${articles[0].title}`);
        console.log(`  Last:  Madde ${articles[articles.length-1].id} — ${articles[articles.length-1].title}`);
        console.log(`  Sample article 8:`, JSON.stringify(articles.find(a=>a.id==='8'), null, 2)?.slice(0,800));
    }
}
