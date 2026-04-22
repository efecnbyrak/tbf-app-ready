import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import ExcelJS from "exceljs";
import { redirect } from "next/navigation";
import { getCurrentSeason } from "@/lib/season-utils";

export const dynamic = "force-dynamic";

function formatDate(d: Date | null): string {
    if (!d) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
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
            orderBy: [{ tarih: "asc" }, { saat: "asc" }],
        });

        const wb = new ExcelJS.Workbook();
        wb.creator = "BKS";

        const ws = wb.addWorksheet("Atamalar");

        const HEADERS = [
            "TARİH", "SAAT", "SALON / MEKAN",
            "A TAKIMI", "B TAKIMI",
            "ÜST KATEGORİ", "HAFTA", "KATEGORİ", "GRUP",
            "1. HAKEM", "2. HAKEM",
            "SAYI GÖREVLİSİ", "SAAT GÖREVLİSİ", "ŞUT SAATİ GÖREVLİSİ",
            "GÖZLEMCİ", "SAHA KOMİSERİ", "SAĞLIKÇI",
            "İSTATİSTİKÇİ 1", "İSTATİSTİKÇİ 2",
        ];

        const RED_FILL: ExcelJS.Fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFCC0000" },
        };

        const headerRow = ws.addRow(HEADERS);
        headerRow.eachCell(cell => {
            cell.fill = RED_FILL;
            cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: false };
            cell.border = {
                top: { style: "thin", color: { argb: "FFAAAAAA" } },
                left: { style: "thin", color: { argb: "FFAAAAAA" } },
                bottom: { style: "thin", color: { argb: "FFAAAAAA" } },
                right: { style: "thin", color: { argb: "FFAAAAAA" } },
            };
        });
        headerRow.height = 22;

        // Column widths
        const colWidths = [12, 8, 30, 28, 28, 20, 8, 20, 10, 24, 24, 22, 22, 22, 22, 22, 18, 22, 22];
        colWidths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });

        for (const a of assignments) {
            const row = ws.addRow([
                formatDate(a.tarih),
                a.saat || "",
                a.salon || "",
                a.aTeam || "",
                a.bTeam || "",
                a.ligTuru || "",
                a.hafta || "",
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

            row.eachCell(cell => {
                cell.font = { size: 9 };
                cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
                cell.border = {
                    top: { style: "hair", color: { argb: "FFDDDDDD" } },
                    left: { style: "hair", color: { argb: "FFDDDDDD" } },
                    bottom: { style: "hair", color: { argb: "FFDDDDDD" } },
                    right: { style: "hair", color: { argb: "FFDDDDDD" } },
                };
            });
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
