import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import fs from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

interface ParsedRule {
    id: string;
    title: string;
    content: string;
    keywords: string[];
}

// Server-side in-memory cache
let cachedRules: ParsedRule[] | null = null;
let cacheTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        "ve", "veya", "ile", "bir", "bu", "da", "de", "ki", "için", "olan",
        "gibi", "her", "daha", "çok", "az", "en", "ne", "ise", "değil",
        "ancak", "fakat", "ama", "eğer", "the", "a", "an", "is", "in",
        "on", "at", "to", "of", "and", "or", "that", "with", "are", "was"
    ]);
    const words = text
        .toLowerCase()
        .replace(/[^a-zçğıöşü0-9\s]/gi, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));
    return [...new Set(words)].slice(0, 20);
}

function extractTitle(filename: string, content: string): string {
    // Try first heading in .md files
    const headingMatch = content.match(/^#+\s+(.+)$/m);
    if (headingMatch) return headingMatch[1].trim();

    // Try first non-empty line
    const firstLine = content.split("\n").find(l => l.trim().length > 3);
    if (firstLine && firstLine.length < 100) return firstLine.trim();

    // Fallback to filename
    return path.basename(filename, path.extname(filename)).replace(/[-_]/g, " ");
}

async function loadRulesFromDisk(): Promise<ParsedRule[]> {
    const rulesDir = path.join(process.cwd(), "data", "rules");
    const rules: ParsedRule[] = [];

    let files: string[];
    try {
        files = await fs.readdir(rulesDir);
    } catch {
        // Directory doesn't exist yet
        return [];
    }

    for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        if (![".txt", ".md", ".json"].includes(ext)) continue;

        const filePath = path.join(rulesDir, file);
        try {
            const raw = await fs.readFile(filePath, "utf-8");
            let content = "";

            if (ext === ".json") {
                try {
                    const parsed = JSON.parse(raw);
                    // Support array of {section, h1, p} objects or plain string/array
                    if (Array.isArray(parsed)) {
                        content = parsed
                            .map((item: any) => {
                                if (typeof item === "string") return item;
                                return [item.section, item.h1, item.h2, item.p]
                                    .filter(Boolean)
                                    .join(" ");
                            })
                            .join("\n");
                    } else if (typeof parsed === "object") {
                        content = JSON.stringify(parsed, null, 2);
                    } else {
                        content = String(parsed);
                    }
                } catch {
                    content = raw;
                }
            } else {
                content = raw;
            }

            const title = extractTitle(file, content);
            const keywords = extractKeywords(content);
            const id = file.replace(/\.[^.]+$/, "");

            rules.push({ id, title, content: content.slice(0, 5000), keywords });
        } catch (err) {
            console.error(`[AI rules] Failed to read ${file}:`, err);
        }
    }

    return rules;
}

export async function GET() {
    // Only SUPER_ADMIN can access
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Oturum açın." }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    }

    const now = Date.now();
    if (cachedRules && now - cacheTime < CACHE_TTL_MS) {
        return NextResponse.json(cachedRules);
    }

    const rules = await loadRulesFromDisk();
    cachedRules = rules;
    cacheTime = now;

    return NextResponse.json(rules);
}
