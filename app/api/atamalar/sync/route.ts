/**
 * Auto-sync: page load'da Drive'dan sadece mevcut hafta dosyasını çeker.
 * Eski arşive bakmaz — sadece son 3 haftanın Drive dosyasını kontrol eder.
 */
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { findAllSpreadsheets, downloadAsXlsx } from "@/lib/google-drive";
import { parseWorkbook } from "@/lib/match-parser";
import { getCurrentSeason } from "@/lib/season-utils";
import { getCurrentWeekNumber } from "@/lib/hafta-utils";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

function splitTeams(macAdi: string): { aTeam: string; bTeam: string } {
    if (!macAdi) return { aTeam: "", bTeam: "" };
    const parts = macAdi.split(/\s+-\s+/);
    return parts.length >= 2
        ? { aTeam: parts[0].trim(), bTeam: parts.slice(1).join(" - ").trim() }
        : { aTeam: macAdi.trim(), bTeam: "" };
}

function ligTuruNormalize(raw: string): string {
    const u = (raw || "").toUpperCase();
    if (u.includes("ÖZEL") || u.includes("ÜNİVERSİTE") || u.includes("OZEL")) {
        return "Özel Lig ve Üniversite";
    }
    return "Yerel Ligler";
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session || session.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const season = getCurrentSeason();
        const currentWeek = getCurrentWeekNumber();

        // Only check Drive files for current week ± 1
        const targetWeeks = [currentWeek - 1, currentWeek, currentWeek + 1].filter(w => w > 0);

        const folderIds = (process.env.GOOGLE_DRIVE_FOLDER_ID || "")
            .split(",").map((s: string) => s.trim()).filter(Boolean);

        if (folderIds.length === 0) {
            return NextResponse.json({ success: true, message: "Drive klasörü tanımlı değil", imported: 0 });
        }

        const { files } = await findAllSpreadsheets(folderIds, -1);

        // Filter to files that look like current-week hafta files for current season
        const weekFiles = files.filter(f => {
            const nameUp = f.name.toUpperCase();
            // Must be a Hafta/week file
            if (!nameUp.includes("HAFTA") && !nameUp.includes("MAÇ PROGRAM") && !nameUp.includes("MAC PROGRAM")) return false;
            // Must match one of the target week numbers
            const haftaMatch = f.name.match(/(\d+)\.?\s*(?:hafta|HAFTA)/i);
            if (!haftaMatch) return false;
            const weekNum = parseInt(haftaMatch[1]);
            return targetWeeks.includes(weekNum);
        });

        let imported = 0;

        for (const file of weekFiles) {
            try {
                const buf = await downloadAsXlsx(file.id, file.mimeType, file.resourceKey);
                const wb = new ExcelJS.Workbook();
                await wb.xlsx.load(new Uint8Array(buf) as any);
                const matches = parseWorkbook(wb, file.name);
                const ligTuru = ligTuruNormalize(file.name);

                for (const m of matches) {
                    const tarih = parseTarih(m.tarih);
                    if (!tarih) continue;
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

        return NextResponse.json({ success: true, imported, checkedWeeks: targetWeeks, season: season.label });
    } catch (e: any) {
        return NextResponse.json({ error: e?.message || "Sunucu hatası" }, { status: 500 });
    }
}
