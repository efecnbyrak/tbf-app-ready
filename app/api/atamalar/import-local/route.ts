/**
 * Local archive import: scans data/archive/ and imports ALL seasons on first run.
 * Subsequent calls (when ATAMALAR_ARCHIVE_IMPORTED is set) re-import only if replaceExisting.
 *
 * Imports:
 *  - "X.Hafta Maç Programı" files  → ligTuru = "Yerel Ligler"
 *  - Files with ÖZEL / ÜNİVERSİTE  → ligTuru = "Özel Lig ve Üniversite"
 *  - Everything else is skipped.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { parseWorkbook } from "@/lib/match-parser";
import { getCurrentSeason } from "@/lib/season-utils";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ARCHIVE_DIR = path.join(process.cwd(), "data", "archive");

function parseTarih(tarihStr: string): Date | null {
    if (!tarihStr) return null;
    const dmyMatch = tarihStr.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        const date = new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
        return isNaN(date.getTime()) ? null : date;
    }
    const iso = new Date(tarihStr);
    return isNaN(iso.getTime()) ? null : iso;
}

function splitTeams(macAdi: string): { aTeam: string; bTeam: string } {
    if (!macAdi) return { aTeam: "", bTeam: "" };
    // For Hafta files: extras are [A takımı, B takımı, kategori]. Take only first two.
    const parts = macAdi.split(/\s+-\s+/);
    if (parts.length >= 2) {
        return { aTeam: parts[0].trim(), bTeam: parts[1].trim() };
    }
    return { aTeam: macAdi.trim(), bTeam: "" };
}

function ligTuruFromPath(relativePath: string, fileName: string): string | null {
    const upper = (relativePath + " " + fileName).toUpperCase().replace(/İ/g, "I").replace(/Ş/g, "S").replace(/Ğ/g, "G").replace(/Ü/g, "U").replace(/Ö/g, "O").replace(/Ç/g, "C");
    if (upper.includes("YEREL LIG") || /\d+\.?\s*HAFTA/i.test(fileName)) return "Yerel Ligler";
    if (upper.includes("OZEL") || upper.includes("UNIVERSITE")) return "Özel Lig ve Üniversite";
    return null; // Skip TBF, Okul, Ceza, Hükmen, ARŞİV non-assignment files
}

function sezonFromFolderName(folderName: string): string | null {
    const m = folderName.match(/(\d{4})-(\d{4})/);
    return m ? `${m[1]}-${m[2]}` : null;
}

function sezonDateRange(sezon: string): { startDate: Date; endDate: Date } | null {
    const parts = sezon.split("-");
    if (parts.length !== 2) return null;
    const [sy, ey] = parts.map(Number);
    return {
        startDate: new Date(`${sy}-09-01T00:00:00.000Z`),
        endDate: new Date(`${ey}-08-31T23:59:59.999Z`),
    };
}

function collectXlsxFiles(dir: string, maxDepth = 2): string[] {
    const results: string[] = [];
    if (maxDepth < 0) return results;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                results.push(...collectXlsxFiles(fullPath, maxDepth - 1));
            } else if (entry.isFile() && /\.(xlsx|xls)$/i.test(entry.name)) {
                results.push(fullPath);
            }
        }
    } catch {}
    return results;
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const replaceExisting: boolean = body.replaceExisting || false;

        // Check if historical archive was already imported
        const importedSetting = await (db as any).systemSetting.findUnique({
            where: { key: "ATAMALAR_ARCHIVE_IMPORTED" },
        });
        const alreadyImported = !!importedSetting;

        // Determine which season folders to scan
        let seasonDirs: { name: string; dirPath: string; sezon: string }[] = [];
        try {
            const entries = fs.readdirSync(ARCHIVE_DIR, { withFileTypes: true });
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                const sezon = sezonFromFolderName(entry.name);
                if (!sezon) continue;
                seasonDirs.push({ name: entry.name, dirPath: path.join(ARCHIVE_DIR, entry.name), sezon });
            }
        } catch (e: any) {
            return NextResponse.json({ error: `Arşiv klasörü okunamadı: ${e.message}` }, { status: 500 });
        }

        // If already imported: only scan the current season folder (fast path).
        // First run: scan all seasons (slow, one-time).
        if (alreadyImported) {
            const currentSezon = getCurrentSeason().label;
            seasonDirs = seasonDirs.filter(d => d.sezon === currentSezon);
        }

        const errors: string[] = [];
        let imported = 0, updated = 0, skipped = 0, total = 0;
        const processedSeasons: string[] = [];

        for (const { dirPath, sezon } of seasonDirs) {
            const dateRange = sezonDateRange(sezon);
            if (!dateRange) continue;

            const files = collectXlsxFiles(dirPath);
            if (files.length === 0) continue;

            processedSeasons.push(sezon);

            for (const filePath of files) {
                const fileName = path.basename(filePath);
                const relativePath = filePath.substring(ARCHIVE_DIR.length);
                const ligTuru = ligTuruFromPath(relativePath, fileName);
                if (!ligTuru) continue; // Skip non-assignment files

                try {
                    const wb = new ExcelJS.Workbook();
                    await wb.xlsx.readFile(filePath);
                    const parsed = parseWorkbook(wb, fileName);

                    for (const m of parsed) {
                        const tarih = parseTarih(m.tarih);
                        if (!tarih) { skipped++; continue; }

                        // Validate date is within season range
                        if (tarih < dateRange.startDate || tarih > dateRange.endDate) { skipped++; continue; }

                        total++;
                        const { aTeam, bTeam } = splitTeams(m.mac_adi);
                        if (!aTeam) { skipped++; continue; }

                        const data: any = {
                            tarih,
                            saat: m.saat || null,
                            salon: m.salon || null,
                            ligTuru,
                            hafta: m.hafta || null,
                            kategori: m.kategori || null,
                            aTeam,
                            bTeam,
                            hakem1: m.hakemler?.[0] || null,
                            hakem2: m.hakemler?.[1] || null,
                            sayiGorevlisi: m.masa_gorevlileri?.[0] || null,
                            saatGorevlisi: m.masa_gorevlileri?.[1] || null,
                            sutSaatiGorevlisi: m.masa_gorevlileri?.[2] || null,
                            gozlemci: m.gozlemciler?.[0] || null,
                            sahaKomiseri: m.sahaKomiserleri?.[0] || null,
                            saglikci: m.saglikcilar?.[0] || null,
                            istatistikci1: m.istatistikciler?.[0] || null,
                            istatistikci2: m.istatistikciler?.[1] || null,
                        };

                        try {
                            const existing = await (db as any).gameAssignment.findFirst({
                                where: { tarih, saat: data.saat, aTeam, bTeam },
                            });

                            if (existing) {
                                if (replaceExisting) {
                                    await (db as any).gameAssignment.update({ where: { id: existing.id }, data });
                                    updated++;
                                } else {
                                    skipped++;
                                }
                            } else {
                                await (db as any).gameAssignment.create({ data });
                                imported++;
                            }
                        } catch (e: any) {
                            errors.push(`${fileName} [${aTeam} vs ${bTeam}]: ${e.message}`);
                        }
                    }
                } catch (e: any) {
                    errors.push(`${fileName}: ${e.message}`);
                }
            }
        }

        // Mark archive as imported (first time)
        if (!alreadyImported) {
            try {
                await (db as any).systemSetting.upsert({
                    where: { key: "ATAMALAR_ARCHIVE_IMPORTED" },
                    create: { key: "ATAMALAR_ARCHIVE_IMPORTED", value: new Date().toISOString() },
                    update: { value: new Date().toISOString() },
                });
            } catch {}
        }

        // Update last import timestamp
        try {
            await (db as any).systemSetting.upsert({
                where: { key: "ATAMALAR_LAST_IMPORT" },
                create: { key: "ATAMALAR_LAST_IMPORT", value: new Date().toISOString() },
                update: { value: new Date().toISOString() },
            });
        } catch {}

        return NextResponse.json({
            success: true,
            firstTime: !alreadyImported,
            seasons: processedSeasons,
            total,
            imported,
            updated,
            skipped,
            errors: errors.slice(0, 30),
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Sunucu hatası" }, { status: 500 });
    }
}
