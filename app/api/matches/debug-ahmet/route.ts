import { NextResponse } from "next/server";
import { downloadAsXlsx } from "@/lib/google-drive";
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
    const secret = searchParams.get("secret");

    if (secret !== "tbf2026" || !fileId) {
        return NextResponse.json({ error: "id and secret=tbf2026 required" }, { status: 400 });
    }

    try {
        const buffer = await downloadAsXlsx(fileId, "application/vnd.google-apps.spreadsheet");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(new Uint8Array(buffer) as any);

        const result: any = { fileId, sheets: [] };

        for (const ws of workbook.worksheets) {
            const rows: any[] = [];
            let ahmetComertFound = false;

            ws.eachRow({ includeEmpty: false }, (row: any, rowNum: number) => {
                const vals: string[] = [];
                let rowHasAhmetComert = false;

                row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
                    while (vals.length < colNumber) vals.push("");
                    const str = cellToString(cell.value);
                    if (normalizeTR(str).includes("ahmet cömert") || normalizeTR(str).includes("ahmet comert")) {
                        rowHasAhmetComert = true;
                        ahmetComertFound = true;
                    }
                    vals[colNumber - 1] = str;
                });

                if (rowHasAhmetComert || rowNum <= 20) {
                    rows.push({ rowNum, isAhmetComertRow: rowHasAhmetComert, data: vals });
                }
            });

            if (ahmetComertFound || rows.length > 0) {
                result.sheets.push({
                    name: ws.name,
                    hasAhmetComert: ahmetComertFound,
                    relevantRows: rows
                });
            }
        }

        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
