import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import { getCurrentSeason } from "@/lib/season-utils";

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

        const assignments = await (db as any).gameAssignment.findMany({
            where,
            orderBy: [{ tarih: "asc" }, { salon: "asc" }, { saat: "asc" }],
        });

        const wb = new ExcelJS.Workbook();
        wb.creator = "BKS";

        // Sheet name: date range of assignments
        let sheetName = "Atamalar";
        if (assignments.length > 0) {
            const first = assignments[0].tarih as Date;
            const last = assignments[assignments.length - 1].tarih as Date;
            const fmt = (d: Date) =>
                `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
            sheetName = `${fmt(first)} - ${fmt(last)}`;
            if (sheetName.length > 31) sheetName = sheetName.substring(0, 31);
        }

        const ws = wb.addWorksheet(sheetName);

        const BLUE_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFDAEEF3" },
        };
        const GRAY_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" },
        };
        const THIN_BLACK: Partial<ExcelJS.Borders> = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
        };

        // Headers — columns 4,5,6 intentionally blank (A Takımı, B Takımı, Kategori)
        const HEADERS = [
            "TARİH", "SPOR SALONU", "SAAT",
            "", "", "",
            "I. HAKEM", "II. HAKEM",
            "SAYI GÖREVLİSİ", "SAAT GÖREVLİSİ", "ŞUT SAATİ GÖREVLİSİ",
            "GÖZLEMCİ / TEMSİLCİ", "SAHA KOMİSERİ", "SAĞLIKÇI",
            "İSTATİSTİK GÖREVLİSİ", "İSTATİSTİK GÖREVLİSİ",
        ];

        const headerRow = ws.addRow(HEADERS);
        headerRow.height = 19.5;
        for (let cn = 1; cn <= HEADERS.length; cn++) {
            const cell = headerRow.getCell(cn);
            cell.fill = BLUE_FILL;
            cell.font = { bold: true, color: { argb: "FF000000" }, size: 9, name: "Calibri" };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
            cell.border = THIN_BLACK;
        }

        // Column widths matching 32.Hafta
        const colWidths = [20.14, 20.43, 5.57, 24.14, 24.57, 19.86, 19.71, 19, 23.86, 23.86, 24, 18.43, 13.86, 8.14, 18.29, 18.29];
        colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

        let lastGroupKey = "";

        for (const a of assignments) {
            const tarihDate: Date = a.tarih instanceof Date ? a.tarih : new Date(a.tarih);
            const dateKey = tarihDate.toISOString().split("T")[0];
            const groupKey = `${dateKey}_${a.salon || ""}`;

            // Separator row between salon groups
            if (lastGroupKey !== "" && groupKey !== lastGroupKey) {
                const sepRow = ws.addRow([]);
                sepRow.height = 3.75;
            }
            lastGroupKey = groupKey;

            const saatDate = timeStringToExcelDate(a.saat);

            const row = ws.addRow([
                tarihDate,
                a.salon || "",
                saatDate ?? (a.saat || ""),
                a.aTeam || "",
                a.bTeam || "",
                a.kategori || "",
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
            row.height = 19.5;

            for (let cn = 1; cn <= 16; cn++) {
                const cell = row.getCell(cn);
                cell.font = { size: 9, name: "Calibri" };
                cell.border = THIN_BLACK;
                cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };

                if (cn === 1) {
                    // TARİH: light blue + Turkish long date format
                    cell.fill = BLUE_FILL;
                    cell.numFmt = 'd" "mmmm" "yyyy" "dddd';
                } else {
                    cell.fill = GRAY_FILL;
                    if (cn === 3 && saatDate) {
                        // SAAT: time format
                        cell.numFmt = "h:mm";
                    }
                }
            }
        }

        ws.views = [{ state: "frozen", ySplit: 1 }];

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
