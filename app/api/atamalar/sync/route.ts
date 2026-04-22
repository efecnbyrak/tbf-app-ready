/**
 * Auto-sync on page load: scans only the "current" Drive folder for new weekly files.
 * Same logic as Maçlarım refresh — finds new assignments and imports them.
 * Does NOT touch old archive folders.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { findAllSpreadsheets, downloadAsXlsx } from "@/lib/google-drive";
import { parseWorkbook } from "@/lib/match-parser";
import { getCurrentSeason } from "@/lib/season-utils";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Current weekly files folder (same as Maçlarım "current" folder)
const CURRENT_FOLDER = "0ByPao_qBUjN-YXJZSG5Fancybmc?resourcekey=0-MKTgAd4XnpTp7S5flJBKuA";

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

function ligTuruNormalize(fileName: string): string {
    const u = (fileName || "").toUpperCase();
    if (u.includes("ÖZEL") || u.includes("ÜNİVERSİTE") || u.includes("OZEL")) return "Özel Lig ve Üniversite";
    if (u.includes("OKUL") || u.includes("İL VE İLÇE")) return "Okul İl ve İlçe";
    return "Yerel Ligler";
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const season = getCurrentSeason();

        // Scan current folder (maxDepth=0: direct children only, fast)
        const { files } = await findAllSpreadsheets([CURRENT_FOLDER], 0);

        let imported = 0;

        for (const file of files) {
            try {
                const buf = await downloadAsXlsx(file.id, file.mimeType, file.resourceKey);
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(new Uint8Array(buf) as any);
                const matches = parseWorkbook(wb, file.name);
                const ligTuru = ligTuruNormalize(file.name);

                for (const m of matches) {
                    const tarih = parseTarih(m.tarih);
                    if (!tarih) continue;
                    // Only current season
                    if (tarih < season.startDate || tarih > season.endDate) continue;

                    const { aTeam, bTeam } = splitTeams(m.mac_adi);

                    const exists = await (db as any).gameAssignment.findFirst({
                        where: { tarih, saat: m.saat || null, aTeam, bTeam },
                    });
                    if (exists) continue;

                    await (db as any).gameAssignment.create({
                        data: {
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
                        },
                    });
                    imported++;
                }
            } catch (e: any) {
                console.error(`[ATAMALAR SYNC] ${file.name}:`, e.message);
            }
        }

        return NextResponse.json({
            success: true,
            imported,
            season: season.label,
            filesChecked: files.length,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Sunucu hatası" }, { status: 500 });
    }
}
