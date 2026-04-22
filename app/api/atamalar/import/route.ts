/**
 * Bulk import: scans Drive (current folder + 2025-2026 archive) and imports
 * all game assignments from the current season into game_assignments table.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { findAllSpreadsheets, downloadAsXlsx } from "@/lib/google-drive";
import { parseWorkbook } from "@/lib/match-parser";
import { getCurrentSeason } from "@/lib/season-utils";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// Drive folder IDs (same as Maçlarım)
const SEASON_FOLDERS: Record<string, string> = {
    "current": "0ByPao_qBUjN-YXJZSG5Fancybmc?resourcekey=0-MKTgAd4XnpTp7S5flJBKuA",
    "2025-2026": "1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s",
    "2024-2025": "12ugwc-i-fQEKbqfS-qbUtaYvz3ozTIsh",
};

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
    const parts = macAdi.split(/\s+-\s+/);
    return parts.length >= 2
        ? { aTeam: parts[0].trim(), bTeam: parts.slice(1).join(" - ").trim() }
        : { aTeam: macAdi.trim(), bTeam: "" };
}

function ligTuruNormalize(fileName: string, ligTuruFromParser: string): string {
    const u = (fileName + " " + (ligTuruFromParser || "")).toUpperCase();
    if (u.includes("ÖZEL") || u.includes("ÜNİVERSİTE") || u.includes("OZEL")) return "Özel Lig ve Üniversite";
    if (u.includes("OKUL") || u.includes("İL VE İLÇE")) return "Okul İl ve İlçe";
    return "Yerel Ligler";
}

async function scanFolderAndParse(folderId: string, season: ReturnType<typeof getCurrentSeason>, errors: string[]) {
    const matches: any[] = [];
    const { files, errors: driveErrors } = await findAllSpreadsheets([folderId], 2);
    errors.push(...driveErrors);

    for (const file of files) {
        try {
            const buf = await downloadAsXlsx(file.id, file.mimeType, file.resourceKey);
            const wb = new ExcelJS.Workbook();
            await wb.xlsx.load(new Uint8Array(buf) as any);
            const parsed = parseWorkbook(wb, file.name);
            const ligTuru = ligTuruNormalize(file.name, parsed[0]?.ligTuru || "");
            matches.push(...parsed.map(m => ({ ...m, ligTuruResolved: ligTuru, sourceFile: file.name })));
        } catch (e: any) {
            errors.push(`${file.name}: ${e.message}`);
        }
    }
    return matches;
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await req.json().catch(() => ({}));
        const replaceExisting: boolean = body.replaceExisting || false;

        const season = getCurrentSeason();
        const errors: string[] = [];
        const allMatches: any[] = [];

        // Scan current folder (latest weekly files, weeks 26+)
        try {
            const cur = await scanFolderAndParse(SEASON_FOLDERS["current"], season, errors);
            allMatches.push(...cur);
        } catch (e: any) {
            errors.push(`Current klasör: ${e.message}`);
        }

        // Scan current season archive folder (weeks 1-25)
        const archiveFolderId = SEASON_FOLDERS[season.label];
        if (archiveFolderId) {
            try {
                const arc = await scanFolderAndParse(archiveFolderId, season, errors);
                allMatches.push(...arc);
            } catch (e: any) {
                errors.push(`Arşiv (${season.label}): ${e.message}`);
            }
        }

        // Import with season date filter
        let imported = 0, updated = 0, skipped = 0, outsideSeason = 0;

        for (const m of allMatches) {
            const tarih = parseTarih(m.tarih);
            if (!tarih) { skipped++; continue; }
            if (tarih < season.startDate || tarih > season.endDate) { outsideSeason++; continue; }

            const { aTeam, bTeam } = splitTeams(m.mac_adi);

            const data: any = {
                tarih,
                saat: m.saat || null,
                salon: m.salon || null,
                ligTuru: m.ligTuruResolved,
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
                errors.push(`DB hatası (${aTeam} vs ${bTeam}): ${e.message}`);
            }
        }

        // Save last import time
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
