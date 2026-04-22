import { NextResponse } from "next/server";
import { downloadAsXlsx } from "@/lib/google-drive";
import { getCachedData } from "@/lib/cache";
import ExcelJS from "exceljs";

export const dynamic = "force-dynamic";

function normalizeTR(name: string): string {
    return name
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function cellToString(cell: any): string {
    if (cell === null || cell === undefined) return "";
    if (typeof cell === "object") {
        if (cell.richText) return cell.richText.map((r: any) => r.text || "").join("");
        if (cell.text) return String(cell.text).trim();
        if (cell.result !== undefined) return String(cell.result).trim();
        if (cell instanceof Date) {
            return `${cell.getDate().toString().padStart(2, "0")}.${(cell.getMonth() + 1).toString().padStart(2, "0")}.${cell.getFullYear()}`;
        }
        return String(cell).trim();
    }
    return String(cell).trim();
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("id");
    const fileName = searchParams.get("name") || "Dosya";
    const mimeType = searchParams.get("mime") || "application/vnd.google-apps.spreadsheet";

    if (!fileId) {
        return NextResponse.json({ error: "id parametresi gerekli." }, { status: 400 });
    }

    try {
        const matches = await getCachedData(
            `drive-parse-${fileId}`,
            async () => {
                const buffer = await downloadAsXlsx(fileId, mimeType);
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(new Uint8Array(buffer) as any);

                const category = fileName
                    .replace(/\.(xlsx|xls|csv)$/i, "")
                    .replace(/ARŞİV\s*/i, "")
                    .trim();

                const parsed: any[] = [];

                for (const ws of workbook.worksheets) {
                    const rows: string[][] = [];
                    ws.eachRow({ includeEmpty: false }, (row: any) => {
                        const vals: string[] = [];
                        row.eachCell({ includeEmpty: true }, (_cell: any, colNumber: number) => {
                            while (vals.length < colNumber) vals.push("");
                            vals[colNumber - 1] = cellToString(_cell.value);
                        });
                        rows.push(vals);
                    });

                    if (rows.length < 2) continue;

                    // Find header
                    let headerIdx = -1;
                    let colMap: Record<string, number[]> = {};

                    for (let i = 0; i < Math.min(rows.length, 20); i++) {
                        const row = rows[i];
                        if (!row || row.length < 3) continue;
                        const lower = row.map(c => normalizeTR(c));

                        const hasHakem = lower.some(c =>
                            c.includes("hakem") || c === "h1" || c === "h2" || c === "h3"
                        );
                        if (!hasHakem) continue;

                        const hasOther = lower.some(c =>
                            c.includes("tarih") || c.includes("saat") || c.includes("salon") ||
                            c.includes("takım") || c.includes("maç") || c.includes("masa") ||
                            c.includes("sağlık") || c.includes("gözlemci") || c.includes("istatistik") ||
                            c.includes("yazıcı") || c.includes("skor") || c.includes("24")
                        );
                        if (!hasOther) continue;

                        headerIdx = i;
                        colMap = {};

                        for (let j = 0; j < lower.length; j++) {
                            const c = lower[j];
                            if (!c) continue;

                            if (c.includes("tarih") || c === "gün") {
                                if (!colMap["tarih"]) colMap["tarih"] = [];
                                colMap["tarih"].push(j);
                            }
                            if (c.includes("saat")) {
                                if (!colMap["saat"]) colMap["saat"] = [];
                                colMap["saat"].push(j);
                            }
                            if (c.includes("salon") || c.includes("spor")) {
                                if (!colMap["salon"]) colMap["salon"] = [];
                                colMap["salon"].push(j);
                            }
                            if (c.includes("maç") || c.includes("karşılaşma") || c.includes("müsabaka") ||
                                c.includes("takım") || c.includes("ev sahibi")) {
                                if (!colMap["mac"]) colMap["mac"] = [];
                                colMap["mac"].push(j);
                            }
                            if (c.includes("hakem") || c === "h1" || c === "h2" || c === "h3") {
                                if (!colMap["hakem"]) colMap["hakem"] = [];
                                colMap["hakem"].push(j);
                            }
                            if (c.includes("masa") || c.includes("yazıcı") || c.includes("skor") ||
                                c.includes("24 sn") || c.includes("24sn") || c.includes("yardımcı")) {
                                if (!colMap["masa"]) colMap["masa"] = [];
                                colMap["masa"].push(j);
                            }
                            if (c.includes("sağlık") || c.includes("sağlıkçı") || c.includes("doktor") || c.includes("sağlik")) {
                                if (!colMap["saglik"]) colMap["saglik"] = [];
                                colMap["saglik"].push(j);
                            }
                            if (c.includes("istatistik") || c.includes("stat")) {
                                if (!colMap["istatistik"]) colMap["istatistik"] = [];
                                colMap["istatistik"].push(j);
                            }
                            if (c.includes("gözlemci") || c.includes("gozlemci")) {
                                if (!colMap["gozlemci"]) colMap["gozlemci"] = [];
                                colMap["gozlemci"].push(j);
                            }
                        }
                        break;
                    }

                    if (headerIdx < 0) continue;

                    for (let i = headerIdx + 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (!row || row.length < 3) continue;
                        if (row.every(c => !c)) continue;

                        const hakemler = (colMap["hakem"] || []).map(j => row[j] || "").filter(v => v.length > 2);
                        const masaGorevlileri = (colMap["masa"] || []).map(j => row[j] || "").filter(v => v.length > 2);
                        const saglikcilar = (colMap["saglik"] || []).map(j => row[j] || "").filter(v => v.length > 2);
                        const istatistikciler = (colMap["istatistik"] || []).map(j => row[j] || "").filter(v => v.length > 2);
                        const gozlemciler = (colMap["gozlemci"] || []).map(j => row[j] || "").filter(v => v.length > 2);

                        if (hakemler.length === 0 && masaGorevlileri.length === 0 &&
                            saglikcilar.length === 0 && istatistikciler.length === 0) continue;

                        let macAdi = "";
                        if (colMap["mac"]?.length) {
                            macAdi = colMap["mac"].map(j => row[j] || "").filter(v => v.length > 1).join(" - ");
                        }
                        if (!macAdi) macAdi = `${category} — ${ws.name}`;

                        parsed.push({
                            mac_adi: macAdi,
                            tarih: colMap["tarih"]?.length ? (row[colMap["tarih"][0]] || "") : "",
                            saat: colMap["saat"]?.length ? (row[colMap["saat"][0]] || "") : "",
                            salon: colMap["salon"]?.length ? (row[colMap["salon"][0]] || "") : "",
                            kategori: category,
                            hakemler,
                            masa_gorevlileri: masaGorevlileri,
                            saglikcilar,
                            istatistikciler,
                            gozlemciler,
                            kaynak_dosya: `${fileName} → ${ws.name}`,
                        });
                    }
                }

                return parsed;
            },
            30 * 60 * 1000 // 30 minutes cache for parsed file matches
        );

        return NextResponse.json({ success: true, fileId, matches });
    } catch (e: any) {
        return NextResponse.json({ error: e.message, fileId }, { status: 500 });
    }
}
