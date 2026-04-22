import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import { getCurrentSeason } from "@/lib/season-utils";
import type { PaymentConfig, PaymentRate } from "@/lib/payment-types";
import { EMPTY_RATE } from "@/lib/payment-types";

export const dynamic = "force-dynamic";

function timeStringToExcelDate(timeStr: string | null): Date | null {
    if (!timeStr) return null;
    const parts = timeStr.split(":");
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    // Excel time base: 1899-12-30
    return new Date(1899, 11, 30, h, m, 0, 0);
}

function formatTurkishDate(d: Date): string {
    return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

// Detect which payment category applies to an assignment
function detectPaymentCategory(
    kategori: string | null | undefined,
    ligTuru: string | null | undefined,
    config: PaymentConfig
): { type: "okul" | "bolge" | "kategori" | null; leagueName: string; leagueRate: PaymentRate | null } {
    const k = (kategori || "").toUpperCase().replace(/\s+/g, " ").trim();
    const lt = (ligTuru || "").toUpperCase().replace(/\s+/g, " ").trim();

    const isYerel =
        lt.includes("OKUL") ||
        lt.includes("İL VE İLÇE") ||
        lt.includes("IL VE ILCE") ||
        lt.includes("YEREL");

    if (isYerel) {
        return { type: "okul", leagueName: "Okul Maçları", leagueRate: config.okulMaclari ?? { ...EMPTY_RATE } };
    }

    // Match kategori against configured categories
    const kats = config.kategoriler || [];
    for (const cat of kats) {
        const catName = cat.name.toUpperCase().replace(/\s+/g, " ").trim();
        if (!catName) continue;
        if (k === catName || k.includes(catName) || catName.includes(k)) {
            return { type: "kategori", leagueName: cat.name, leagueRate: cat.rates ?? { ...EMPTY_RATE } };
        }
    }

    if (k) {
        return { type: "kategori", leagueName: kategori || "", leagueRate: null };
    }

    return { type: null, leagueName: kategori || ligTuru || "", leagueRate: null };
}

export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (session.role !== "SUPER_ADMIN") {
            return new NextResponse("Yetkisiz", { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const ligTuru = searchParams.get("ligTuru") || undefined;
        const hafta = searchParams.get("hafta") ? parseInt(searchParams.get("hafta")!) : undefined;

        const season = getCurrentSeason();
        const where: any = {
            tarih: { gte: season.startDate, lte: season.endDate },
        };
        if (ligTuru) where.ligTuru = ligTuru;
        if (hafta) where.hafta = hafta;

        const [assignments, paymentSetting] = await Promise.all([
            (db as any).gameAssignment.findMany({
                where,
                orderBy: [{ tarih: "asc" }, { salon: "asc" }, { saat: "asc" }],
            }),
            db.systemSetting.findUnique({ where: { key: "PAYMENT_CONFIG" } }),
        ]);

        let paymentConfig: PaymentConfig = {
            okulMaclari: { ...EMPTY_RATE },
            bolgeMaclari: { ...EMPTY_RATE },
            kategoriler: [],
        };
        if (paymentSetting?.value) {
            try {
                paymentConfig = JSON.parse(paymentSetting.value);
            } catch { /* use default */ }
        }

        const wb = new ExcelJS.Workbook();
        wb.creator = "BKS";

        // ─── Sheet 1: Atamalar ───────────────────────────────────────────────────
        let sheetName = "Atamalar";
        if (assignments.length > 0) {
            const first = assignments[0].tarih as Date;
            const last = assignments[assignments.length - 1].tarih as Date;
            const fmt = (d: Date) => formatTurkishDate(d);
            sheetName = `${fmt(first)} - ${fmt(last)}`;
            if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
        }

        const ws = wb.addWorksheet(sheetName);

        const WHITE_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
        };
        const GREEN_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD9EAD3" },
        };
        const HEADER_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFC00000" },
        };
        const THIN_BLACK: Partial<ExcelJS.Borders> = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
        };

        const HEADERS = [
            "TARİH", "SALON", "SAAT",
            "A TAKIMI", "B TAKIMI", "KATEGORİ", "GRUP",
            "1.HAKEM (BAŞ HAKEM)", "2.HAKEM (YARDIMCI HAKEM)",
            "SAYI GÖREVLİSİ", "SAAT GÖREVLİSİ", "ŞUT SAATİ GÖREVLİSİ",
            "GÖZLEMCİ", "SAHA KOMİSERİ", "SAĞLIKÇI",
            "İSTATİSTİKÇİ", "İSTATİSTİKÇİ",
        ];

        const headerRow = ws.addRow(HEADERS);
        headerRow.height = 30;
        for (let cn = 1; cn <= HEADERS.length; cn++) {
            const cell = headerRow.getCell(cn);
            cell.fill = HEADER_FILL;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
            cell.border = THIN_BLACK;
        }

        const colWidths = [28, 38, 10, 35, 35, 20, 15, 32, 32, 30, 30, 32, 28, 22, 20, 26, 26];
        colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

        let salonColorIndex = 0;
        let lastSalon = "";

        for (const a of assignments) {
            const tarihDate: Date = a.tarih instanceof Date ? a.tarih : new Date(a.tarih);
            const currentSalon = a.salon || "";

            if (currentSalon !== lastSalon) {
                if (lastSalon !== "") salonColorIndex++;
                lastSalon = currentSalon;
            }

            const rowFill = salonColorIndex % 2 === 0 ? WHITE_FILL : GREEN_FILL;
            const saatDate = timeStringToExcelDate(a.saat);

            const row = ws.addRow([
                tarihDate,
                a.salon || "",
                saatDate ?? (a.saat || ""),
                a.aTeam || "",
                a.bTeam || "",
                a.kategori || "",
                a.grup || "",
                a.hakem1 || "",
                a.hakem2 || "",
                a.sayiGorevlisi || "",
                a.saatGorevlisi || "",
                a.sutSaatiGorevlisi || "",
                a.gozlemci || "",
                a.sahaKomiseri || "",
                a.saglikci || "",
                a.istatistikci1 || "",
                a.istatistikci2 || "",
            ]);
            row.height = 22;

            for (let cn = 1; cn <= 17; cn++) {
                const cell = row.getCell(cn);
                cell.font = { size: 10, name: "Calibri" };
                cell.border = THIN_BLACK;
                cell.alignment = {
                    vertical: "middle",
                    horizontal: cn === 1 ? "left" : "center",
                    wrapText: false,
                };
                cell.fill = rowFill;

                if (cn === 1) {
                    cell.numFmt = 'd" "mmmm" "yyyy" "dddd';
                } else if (cn === 3 && saatDate) {
                    cell.numFmt = "h:mm";
                }
            }
        }

        ws.views = [{ state: "frozen", ySplit: 1 }];

        // ─── Sheet 2: Ödemeler ───────────────────────────────────────────────────
        const wsOdemeler = wb.addWorksheet("Ödemeler");

        const PAYMENT_HEADER_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF1D4B2F" }, // Dark green for payments sheet
        };
        const PAYMENT_EVEN_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF0FAF3" },
        };
        const TOTAL_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFEF3C7" }, // Light amber for total rows
        };

        const PAYMENT_HEADERS = [
            "TARİH", "A TAKIMI - B TAKIMI", "KATEGORİ", "LİG TÜRÜ", "İSİM", "GÖREV", "ÜCRET (₺)"
        ];

        const payHeaderRow = wsOdemeler.addRow(PAYMENT_HEADERS);
        payHeaderRow.height = 32;
        for (let cn = 1; cn <= PAYMENT_HEADERS.length; cn++) {
            const cell = payHeaderRow.getCell(cn);
            cell.fill = PAYMENT_HEADER_FILL;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
            cell.border = THIN_BLACK;
        }

        const payColWidths = [26, 42, 22, 28, 34, 24, 18];
        payColWidths.forEach((w, i) => { wsOdemeler.getColumn(i + 1).width = w; });

        let payRowIndex = 2;
        let totalAmount = 0;

        for (const a of assignments) {
            const tarihDate: Date = a.tarih instanceof Date ? a.tarih : new Date(a.tarih);
            const macAdi = `${a.aTeam || "—"} - ${a.bTeam || "—"}`;
            const paymentCategory = detectPaymentCategory(a.kategori, a.ligTuru, paymentConfig);

            const referees: { name: string; role: keyof PaymentRate; label: string }[] = [];
            if (a.hakem1) referees.push({ name: a.hakem1, role: "basHakem", label: "Baş Hakem" });
            if (a.hakem2) {
                // Final matches may have two referees in hakem2 separated by "-"
                if (a.hakem2.includes("-")) {
                    const parts = a.hakem2.split("-").map((s: string) => s.trim()).filter(Boolean);
                    if (parts.length >= 2) {
                        referees.push({ name: parts[0], role: "yardimciHakem", label: "1. Yardımcı Hakem" });
                        referees.push({ name: parts[1], role: "ikinciYardimciHakem", label: "2. Yardımcı Hakem" });
                    } else {
                        referees.push({ name: a.hakem2, role: "yardimciHakem", label: "Yardımcı Hakem" });
                    }
                } else {
                    referees.push({ name: a.hakem2, role: "yardimciHakem", label: "Yardımcı Hakem" });
                }
            }

            for (const ref of referees) {
                const amount = paymentCategory.leagueRate ? paymentCategory.leagueRate[ref.role] : null;
                const isEven = (payRowIndex % 2 === 0);

                const dataRow = wsOdemeler.addRow([
                    tarihDate,
                    macAdi,
                    a.kategori || "—",
                    paymentCategory.leagueName || a.ligTuru || "—",
                    ref.name,
                    ref.label,
                    amount ?? "",
                ]);
                dataRow.height = 22;

                for (let cn = 1; cn <= 7; cn++) {
                    const cell = dataRow.getCell(cn);
                    cell.font = { size: 10, name: "Calibri" };
                    cell.border = THIN_BLACK;
                    cell.fill = isEven ? PAYMENT_EVEN_FILL : WHITE_FILL;
                    cell.alignment = {
                        vertical: "middle",
                        horizontal: cn === 1 || cn === 2 || cn === 5 ? "left" : "center",
                        wrapText: false,
                    };
                    if (cn === 1) cell.numFmt = 'dd.mm.yyyy';
                    if (cn === 7 && amount !== null) {
                        cell.numFmt = '#,##0.00';
                        cell.alignment = { vertical: "middle", horizontal: "right", wrapText: false };
                    }
                }

                if (amount !== null) totalAmount += amount;
                payRowIndex++;
            }
        }

        // Add Ek Ödemeler rows just before the total
        const ekOdemeler: any[] = (paymentConfig as any).ekOdemeler || [];
        if (ekOdemeler.length > 0) {
            const EK_FILL: ExcelJS.Fill = {
                type: "pattern", pattern: "solid",
                fgColor: { argb: "FFE8F5E9" },
            };
            for (const ek of ekOdemeler) {
                if (!ek.aciklama && !ek.tutar) continue;
                const ekRow = wsOdemeler.addRow([
                    "", "", "", "", "", ek.aciklama || "Ek Ödeme", Number(ek.tutar) || 0,
                ]);
                ekRow.height = 22;
                for (let cn = 1; cn <= 7; cn++) {
                    const cell = ekRow.getCell(cn);
                    cell.font = { size: 10, name: "Calibri", italic: true };
                    cell.border = THIN_BLACK;
                    cell.fill = EK_FILL;
                    cell.alignment = {
                        vertical: "middle",
                        horizontal: cn === 7 ? "right" : "center",
                        wrapText: false,
                    };
                    if (cn === 7) cell.numFmt = "#,##0.00";
                }
                totalAmount += Number(ek.tutar) || 0;
                payRowIndex++;
            }
        }

        // Add totals row
        wsOdemeler.addRow([]); // Empty spacer row
        const totalRow = wsOdemeler.addRow([
            "", "", "", "", "", "GENEL TOPLAM", totalAmount,
        ]);
        totalRow.height = 26;
        for (let cn = 1; cn <= 7; cn++) {
            const cell = totalRow.getCell(cn);
            cell.fill = TOTAL_FILL;
            cell.border = THIN_BLACK;
            cell.font = { bold: true, size: 11, name: "Calibri" };
            cell.alignment = { vertical: "middle", horizontal: cn === 7 ? "right" : "center", wrapText: false };
            if (cn === 7) cell.numFmt = '#,##0.00';
        }

        wsOdemeler.views = [{ state: "frozen", ySplit: 1 }];
        wsOdemeler.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: 7 } };

        const buffer = await wb.xlsx.writeBuffer();

        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        const filename = `Atamalar_${dateStr}.xlsx`;

        return new NextResponse(buffer as any, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (e: any) {
        return new NextResponse(e?.message || "Hata", { status: 500 });
    }
}
