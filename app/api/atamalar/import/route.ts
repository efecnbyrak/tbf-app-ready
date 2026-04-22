import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { findAllSpreadsheets, downloadAsXlsx } from "@/lib/google-drive";
import { parseWorkbook } from "@/lib/match-parser";
import { getCurrentSeason } from "@/lib/season-utils";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function parseTarih(tarihStr: string): Date | null {
    if (!tarihStr) return null;
    const dmyMatch = tarihStr.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (dmyMatch) {
        const [, d, m, y] = dmyMatch;
        return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T00:00:00.000Z`);
    }
    const iso = new Date(tarihStr);
    return isNaN(iso.getTime()) ? null : iso;
}

function ligTuruNormalize(raw: string): string {
    const u = (raw || "").toUpperCase();
    if (u.includes("ÖZEL") || u.includes("ÜNİVERSİTE") || u.includes("OZEL")) {
        return "Özel Lig ve Üniversite";
    }
    return "Yerel Ligler";
}

function splitTeams(macAdi: string): { aTeam: string; bTeam: string } {
    if (!macAdi) return { aTeam: "", bTeam: "" };
    const parts = macAdi.split(/\s+-\s+/);
    if (parts.length >= 2) {
        return { aTeam: parts[0].trim(), bTeam: parts.slice(1).join(" - ").trim() };
    }
    return { aTeam: macAdi.trim(), bTeam: "" };
}

async function parseLocalXlsx(filePath: string, fileName: string) {
    const buffer = fs.readFileSync(filePath);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    return parseWorkbook(wb, fileName);
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const source: "local" | "drive" | "both" = body.source || "both";
        const replaceExisting: boolean = body.replaceExisting || false;

        const season = getCurrentSeason();
        const allMatches: any[] = [];
        const errors: string[] = [];

        // ── 1. Local Archive (current season folder) ──────────────
        if (source === "local" || source === "both") {
            const archiveBase = path.join(process.cwd(), "data", "archive");
            const seasonDir = path.join(archiveBase, season.folderName);

            if (fs.existsSync(seasonDir)) {
                // Yerel Ligler hafta dosyaları
                const yerelDir = path.join(seasonDir, "Yerel Ligler");
                if (fs.existsSync(yerelDir)) {
                    for (const f of fs.readdirSync(yerelDir).filter(f => /\.(xlsx|xls)$/i.test(f))) {
                        try {
                            const matches = await parseLocalXlsx(path.join(yerelDir, f), f);
                            allMatches.push(...matches.map(m => ({ ...m, ligTuruRaw: "Yerel Ligler" })));
                        } catch (e: any) {
                            errors.push(`Yerel/${f}: ${e.message}`);
                        }
                    }
                }

                // Özel Lig dosyaları (root'taki xlsx'ler, özel/üniversite içerenler)
                for (const f of fs.readdirSync(seasonDir).filter(f =>
                    /\.(xlsx|xls)$/i.test(f) && /özel|ozel|üniversite|universite/i.test(f)
                )) {
                    try {
                        const matches = await parseLocalXlsx(path.join(seasonDir, f), f);
                        allMatches.push(...matches.map(m => ({ ...m, ligTuruRaw: "Özel Lig ve Üniversite" })));
                    } catch (e: any) {
                        errors.push(`ÖzelLig/${f}: ${e.message}`);
                    }
                }
            } else {
                errors.push(`Yerel arşiv klasörü bulunamadı: "${season.folderName}". Drive üzerinden devam ediliyor.`);
            }
        }

        // ── 2. Google Drive ───────────────────────────────────────
        if (source === "drive" || source === "both") {
            const folderIds = (process.env.GOOGLE_DRIVE_FOLDER_ID || "")
                .split(",").map((s: string) => s.trim()).filter(Boolean);

            if (folderIds.length > 0) {
                try {
                    const { files, errors: driveErrors } = await findAllSpreadsheets(folderIds, -1);
                    errors.push(...driveErrors);

                    for (const file of files) {
                        try {
                            const buf = await downloadAsXlsx(file.id, file.mimeType, file.resourceKey);
                            const wb = new ExcelJS.Workbook();
                            await wb.xlsx.load(new Uint8Array(buf) as any);
                            const matches = parseWorkbook(wb, file.name);
                            const lig = ligTuruNormalize(file.name);
                            allMatches.push(...matches.map(m => ({ ...m, ligTuruRaw: lig })));
                        } catch (e: any) {
                            errors.push(`Drive/${file.name}: ${e.message}`);
                        }
                    }
                } catch (e: any) {
                    errors.push(`Drive bağlantı hatası: ${e.message}`);
                }
            }
        }

        // ── 3. Filter to current season & import ─────────────────
        let imported = 0;
        let skipped = 0;
        let updated = 0;
        let outsideSeason = 0;

        for (const m of allMatches) {
            const tarih = parseTarih(m.tarih);
            if (!tarih) { skipped++; continue; }

            // Only import current season data
            if (tarih < season.startDate || tarih > season.endDate) {
                outsideSeason++;
                continue;
            }

            const { aTeam, bTeam } = splitTeams(m.mac_adi);
            const ligTuru = m.ligTuruRaw || ligTuruNormalize(m.ligTuru || "");

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
                errors.push(`Kayıt hatası (${aTeam} vs ${bTeam}): ${e.message}`);
            }
        }

        // Save last sync time
        try {
            await (db as any).systemSetting.upsert({
                where: { key: "ATAMALAR_LAST_IMPORT" },
                create: { key: "ATAMALAR_LAST_IMPORT", value: new Date().toISOString() },
                update: { value: new Date().toISOString() },
            });
        } catch {}

        return NextResponse.json({
            success: true,
            season: season.label,
            total: allMatches.length,
            outsideSeason,
            imported,
            updated,
            skipped,
            errors: errors.slice(0, 20),
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Sunucu hatası" }, { status: 500 });
    }
}
