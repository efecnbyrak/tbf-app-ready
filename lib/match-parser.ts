import { findAllSpreadsheets, downloadAsXlsx } from "./google-drive";
import ExcelJS from "exceljs";

export interface MatchData {
    mac_adi: string;
    tarih: string;
    saat?: string;
    salon?: string;
    kategori: string;
    hafta?: number;
    sezon?: string;
    ligTuru: string;
    hakemler: string[];
    masa_gorevlileri: string[];
    saglikcilar: string[];
    istatistikciler: string[];
    gozlemciler: string[];
    sahaKomiserleri: string[];
    kaynak_dosya: string;
}

export interface UserMatchSummary {
    toplam_mac: number;
    kategoriler: Record<string, number>;
    maclar: MatchData[];
}

// ============================================================
// Turkish Name Matching — STRICT mode
// ============================================================

function normalizeTR(name: string): string {
    if (!name) return "";
    return name
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç")
        .replace(/i̇/g, "i")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Strict name matching for Turkish names.
 * 
 * MUST match rules:
 * 1. Last name must match EXACTLY (no typos allowed on soyadı)
 * 2. First name must match exactly OR with 1 char difference (for typos like "CN" → "CAN")
 * 3. Name order doesn't matter: "Bayrak Efe Can" = "Efe Can Bayrak"
 * 4. Case insensitive with Turkish char normalization
 */
export function nameMatches(cellName: string, firstName: string, lastName: string): boolean {
    if (!cellName || cellName.length < 3) return false;
    if (!firstName || !lastName) return false;

    const cellNorm = normalizeTR(cellName);
    const fNorm = normalizeTR(firstName);
    const lNorm = normalizeTR(lastName);

    // Rule 1: Cell MUST contain the exact last name
    if (!cellNorm.includes(lNorm)) return false;

    // Rule 2: Check first name presence
    // Split first name into parts (e.g., "Efe Can" → ["efe", "can"])
    const firstNameParts = fNorm.split(/\s+/);
    const cellWords = cellNorm.split(/[\s,.;\-/()]+/).filter(w => w.length > 0);

    // Remove last name words from cell to check first name
    const lastNameParts = lNorm.split(/\s+/);
    const remainingWords = cellWords.filter(w => !lastNameParts.includes(w));

    // Check if ALL first name parts are found (exact or 1 char off)
    let allFirstNameFound = true;
    for (const fnPart of firstNameParts) {
        const found = remainingWords.some(rw => {
            if (rw === fnPart) return true;
            // Allow only 1 character difference for first name parts
            if (Math.abs(rw.length - fnPart.length) <= 1) {
                return levenshteinSimple(rw, fnPart) <= 1;
            }
            return false;
        });
        if (!found) {
            allFirstNameFound = false;
            break;
        }
    }

    if (allFirstNameFound) return true;

    // Check full name as substring (no word splitting)
    const fullName = `${fNorm} ${lNorm}`;
    const fullNameRev = `${lNorm} ${fNorm}`;
    if (cellNorm.includes(fullName) || cellNorm.includes(fullNameRev)) return true;

    return false;
}

/**
 * Simple Levenshtein for short strings
 */
function levenshteinSimple(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];
    for (let i = 0; i <= a.length; i++) matrix[i] = [i];
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    return matrix[a.length][b.length];
}

// ============================================================
// Excel Parsing
// ============================================================

function cellToString(cell: any): string {
    if (cell === null || cell === undefined) return "";
    if (typeof cell === "object") {
        if (cell.richText) return cell.richText.map((r: any) => r.text || "").join("");
        if (cell.text) return String(cell.text).trim();
        if (cell.result !== undefined) return String(cell.result).trim();
        if (cell.hyperlink) return String(cell.text || cell.hyperlink).trim();
        if (cell instanceof Date) {
            const d = cell as Date;
            // Excel stores time-only values as dates in Dec 1899
            if (d.getFullYear() < 1910) {
                const h = d.getHours().toString().padStart(2, "0");
                const m = d.getMinutes().toString().padStart(2, "0");
                if (h === "00" && m === "00") return "";
                return `${h}:${m}`;
            }
            return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()}`;
        }
        return String(cell).trim();
    }
    // Handle numeric time serials (e.g. 0.6 = 14:24)
    if (typeof cell === "number" && cell > 0 && cell < 1) {
        const totalMinutes = Math.round(cell * 24 * 60);
        const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
        const m = (totalMinutes % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
    }
    return String(cell).trim();
}

function cleanSaat(saat: string): string {
    if (!saat) return "";
    if (/^\d{1,2}:\d{2}$/.test(saat)) return saat;
    if (saat.includes("1899") || saat.includes("1900")) return "";
    return saat;
}

function cleanDatePrefix(text: string): string {
    if (!text) return "";
    return text.replace(/^\s*(?:\d{1,2}[./-]\d{1,2}[./-]\d{4}\s*(?:-\s*)?|-\s*)/, "").trim();
}

function parseFileMetadata(fileName: string): { hafta?: number; ligTuru: string } {
    const fn = fileName.toUpperCase();
    const haftaMatch = fileName.match(/(\d+)\.?\s*(?:hafta|HAFTA)/i);
    const hafta = haftaMatch ? parseInt(haftaMatch[1], 10) : undefined;

    if (fn.includes("OKUL") || fn.includes("İL VE İLÇE") || fn.includes("IL VE ILCE")) {
        return { hafta, ligTuru: "OKUL İL VE İLÇE" };
    }
    if (fn.includes("ÖZEL LİG") || fn.includes("ÜNİVERSİTE") || fn.includes("OZEL LIG") || fn.includes("UNIVERSITE")) {
        return { hafta, ligTuru: "ÖZEL LİG VE ÜNİVERSİTE" };
    }
    if (fn.includes("TBF") || fn.includes("MİLLİ") || fn.includes("FIBA") || fn.includes("AVRUPA")) {
        return { hafta, ligTuru: "TBF / MİLLİ" };
    }
    if (fn.includes("HÜKMEN")) return { hafta, ligTuru: "HÜKMEN" };
    if (fn.includes("CEZA")) return { hafta, ligTuru: "CEZA KARARLARI" };
    return { hafta, ligTuru: "Yerel Lig" };
}

function isGenericSheetName(name: string): boolean {
    return /^(sheet\s*\d*|sayfa\s*\d*|worksheet\s*\d*|çalışma\s*sayfası\s*\d*|data\s*\d*)$/i.test(name.trim());
}

export function parseWorkbook(workbook: ExcelJS.Workbook, fileName: string): MatchData[] {
    const allMatches: MatchData[] = [];
    const category = fileName.replace(/\.(xlsx|xls|csv)$/i, "").replace(/ARŞİV\s*/i, "").trim();
    const fileMeta = parseFileMetadata(fileName);

    for (const ws of workbook.worksheets) {
        // Use worksheet name as category (e.g. "U18EA", "SBL"), fall back to file name
        const sheetCategory = ws.name && ws.name.trim().length > 0 && !isGenericSheetName(ws.name)
            ? ws.name.trim()
            : category;

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

        let headerIdx = -1;
        let colMap: Record<string, number[]> = {};

        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;
            const lower = row.map(c => normalizeTR(c));

            const hasRole = lower.some(c =>
                c.includes("hakem") || c === "h1" || c === "h2" || c === "h3" ||
                c.includes("masa") || c.includes("yazıcı") || c.includes("skor") ||
                c.includes("24 sn") || c.includes("24sn") || c.includes("yardımcı") ||
                c.includes("sağlık") || c.includes("gözlemci") || c.includes("istatistik") || c.includes("stat")
            );
            if (!hasRole) continue;

            const hasContext = lower.some(c =>
                c.includes("tarih") || c === "gün" || c.includes("saat") || c.includes("salon") || c.includes("spor") ||
                c.includes("takım") || c.includes("maç") || c.includes("karşılaşma") || c.includes("ev sahibi")
            );
            if (!hasContext) continue;

            headerIdx = i;
            colMap = {};

            let lastColCategory = "";
            for (let j = 0; j < lower.length; j++) {
                const c = lower[j];
                if (!c) {
                    if (lastColCategory && colMap[lastColCategory]) {
                        colMap[lastColCategory].push(j);
                    }
                    continue;
                }
                lastColCategory = "";

                if (c.includes("tarih") || c === "gün") {
                    if (!colMap["tarih"]) colMap["tarih"] = []; colMap["tarih"].push(j);
                } else if ((c.includes("saat") && !c.includes("srm") && !c.includes("sorumlu") && !c.includes("görevli") && !c.includes("hakem")) || c === "saat") {
                    if (!colMap["saat"]) colMap["saat"] = []; colMap["saat"].push(j);
                } else if (c.includes("salon") || c.includes("spor")) {
                    if (!colMap["salon"]) colMap["salon"] = []; colMap["salon"].push(j);
                } else if (c.includes("organizasyon") || c === "org") {
                    if (!colMap["organizasyon"]) colMap["organizasyon"] = []; colMap["organizasyon"].push(j);
                } else if (c.includes("maç") || c.includes("karşılaşma") || c.includes("müsabaka") || c.includes("takım") || c.includes("ev sahibi")) {
                    if (!colMap["mac"]) colMap["mac"] = []; colMap["mac"].push(j);
                } else if (c.includes("istatistik") || c.includes("stat")) {
                    if (!colMap["istatistik"]) colMap["istatistik"] = []; colMap["istatistik"].push(j);
                    lastColCategory = "istatistik";
                } else if (c.includes("sağlık") || c.includes("doktor") || c.includes("sağlik")) {
                    if (!colMap["saglik"]) colMap["saglik"] = []; colMap["saglik"].push(j);
                    lastColCategory = "saglik";
                } else if (c.includes("gözlemci") || c.includes("gozlemci")) {
                    if (!colMap["gozlemci"]) colMap["gozlemci"] = []; colMap["gozlemci"].push(j);
                    lastColCategory = "gozlemci";
                } else if (c.includes("komiseri") || c.includes("komiser") || (c.includes("saha") && c.includes("kom"))) {
                    if (!colMap["sahaKomiseri"]) colMap["sahaKomiseri"] = []; colMap["sahaKomiseri"].push(j);
                    lastColCategory = "sahaKomiseri";
                } else if (
                    c.includes("masa") || c.includes("yazıcı") || c.includes("skor") || c.includes("24") ||
                    (c.includes("yardımcı") && !c.includes("hakem")) || c.includes("srm") || c.includes("sorumlu") ||
                    c.includes("opr") || c.includes("operatör") || c.includes("şut") || c.includes("sut") ||
                    c.includes("süre") || c.includes("sure") || c.includes("kronometre") ||
                    (c.includes("sayı") && !c.includes("istatistik")) ||
                    c.includes("saat görevlisi") || c.includes("saat gorevlisi")
                ) {
                    if (!colMap["masa"]) colMap["masa"] = []; colMap["masa"].push(j);
                    lastColCategory = "masa";
                } else if (c.includes("hakem") || c === "h1" || c === "h2" || c === "h3") {
                    if (!colMap["hakem"]) colMap["hakem"] = []; colMap["hakem"].push(j);
                    lastColCategory = "hakem";
                }
            }
            break;
        }

        if (headerIdx < 0) continue;

        let lastTarih = "";
        let lastSalon = "";

        for (let i = headerIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;
            if (row.every(c => !c || c.trim() === "")) continue;

            let rowTarih = "";
            let rowSalon = "";

            if (colMap["tarih"]?.length) {
                rowTarih = row[colMap["tarih"][0]] || "";
                if (rowTarih && /\d/.test(rowTarih)) lastTarih = rowTarih.trim();
            }

            // TBF schedules often have empty rows with just ONE merged cell containing the date and venue (e.g., "12.03.2026 - KAĞITHANE İLÇE").
            // We must capture this BEFORE skipping the row due to lack of referees!
            if (!rowTarih) {
                const possibleDate = row.find(c => c && /\d{1,2}\s*[./-]\s*\d{1,2}\s*[./-]\s*\d{4}/.test(c));
                if (possibleDate) {
                    lastTarih = possibleDate.trim();
                }
            }

            if (colMap["salon"]?.length) {
                rowSalon = cleanDatePrefix(row[colMap["salon"][0]] || "");
                if (rowSalon && rowSalon.length > 2) lastSalon = rowSalon.trim();
            }

            const hakemler = (colMap["hakem"] || []).map(j => row[j] || "").filter(v => v.length > 2);
            const masaGorevlileri = (colMap["masa"] || []).map(j => row[j] || "").filter(v => v.length > 2);
            const saglikcilar = (colMap["saglik"] || []).map(j => row[j] || "").filter(v => v.length > 2);
            const istatistikciler = (colMap["istatistik"] || []).map(j => row[j] || "").filter(v => v.length > 2);
            const gozlemciler = (colMap["gozlemci"] || []).map(j => row[j] || "").filter(v => v.length > 2);
            const sahaKomiserleri = (colMap["sahaKomiseri"] || []).map(j => row[j] || "").filter(v => v.length > 2);

            if (hakemler.length === 0 && masaGorevlileri.length === 0 &&
                saglikcilar.length === 0 && istatistikciler.length === 0 &&
                gozlemciler.length === 0 && sahaKomiserleri.length === 0) continue;

            let macAdi = "";
            if (colMap["mac"]?.length) {
                macAdi = colMap["mac"].map(j => row[j] || "").filter(v => v.length > 1).join(" - ");
            }
            if (!macAdi) {
                const usedCols = new Set([
                    ...(colMap["hakem"] || []), ...(colMap["masa"] || []),
                    ...(colMap["saglik"] || []), ...(colMap["istatistik"] || []),
                    ...(colMap["gozlemci"] || []), ...(colMap["sahaKomiseri"] || []),
                    ...(colMap["tarih"] || []),
                    ...(colMap["saat"] || []), ...(colMap["salon"] || []), ...(colMap["mac"] || []),
                ]);
                const extras = row.map((v, j) => ({ v, j })).filter(x => x.v.length > 2 && !usedCols.has(x.j)).map(x => x.v).slice(0, 3);
                if (extras.length > 0) macAdi = extras.join(" - ");
            }
            if (!macAdi) macAdi = `${category} — ${ws.name}`;

            macAdi = cleanDatePrefix(macAdi);

            let tarih = rowTarih || "";
            if (tarih && /\d/.test(tarih)) lastTarih = tarih;
            else if (!tarih && lastTarih) tarih = lastTarih;

            let saat = "";
            if (colMap["saat"]?.length) saat = cleanSaat(row[colMap["saat"][0]] || "");

            let salon = rowSalon || "";
            if (salon && salon.length > 2) lastSalon = salon;
            else if (!salon && lastSalon) salon = lastSalon;

            // If there's an ORGANİZASYON column, use its value as kategori
            let rowKategori = sheetCategory;
            if (colMap["organizasyon"]?.length) {
                const orgVal = (row[colMap["organizasyon"][0]] || "").trim();
                if (orgVal.length > 1) rowKategori = orgVal;
            }

            allMatches.push({
                mac_adi: macAdi, tarih, saat, salon,
                kategori: rowKategori, hafta: fileMeta.hafta, ligTuru: fileMeta.ligTuru,
                hakemler, masa_gorevlileri: masaGorevlileri, saglikcilar, istatistikciler, gozlemciler,
                sahaKomiserleri,
                kaynak_dosya: `${fileName} → ${ws.name}`,
            });
        }
    }
    return allMatches;
}

// ============================================================
// Get matches from Drive
// ============================================================

export async function getAllMatches(folderIds: string[], maxDepth: number = 0): Promise<MatchData[]> {
    const startTime = Date.now();
    const { files, errors } = await findAllSpreadsheets(folderIds, maxDepth);
    console.log(`[MATCHES] Found ${files.length} spreadsheets. Errors: ${errors.length}`);

    const allMatches: MatchData[] = [];
    const CONCURRENCY = 3;

    for (let i = 0; i < files.length; i += CONCURRENCY) {
        const chunk = files.slice(i, i + CONCURRENCY);
        const chunkResults = await Promise.all(chunk.map(async (sheet) => {
            try {
                const buffer = await downloadAsXlsx(sheet.id, sheet.mimeType, sheet.resourceKey);
                const workbook = new ExcelJS.Workbook();
                await workbook.xlsx.load(new Uint8Array(buffer) as any);
                const matches = parseWorkbook(workbook, sheet.name);
                console.log(`[MATCHES] ✅ ${sheet.name}: ${matches.length} maç`);
                return matches;
            } catch (e: any) {
                console.error(`[MATCHES] ❌ ${sheet.name}: ${e?.message}`);
                return [];
            }
        }));
        allMatches.push(...chunkResults.flat());
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[MATCHES] Done: ${allMatches.length} matches in ${duration}s`);
    return allMatches;
}

export function getMatchesForUser(allMatches: MatchData[], firstName: string, lastName: string): UserMatchSummary {
    const userMatches = allMatches.filter(match => {
        const allPeople = [
            ...match.hakemler, ...match.masa_gorevlileri,
            ...match.saglikcilar, ...match.istatistikciler, ...match.gozlemciler,
            ...match.sahaKomiserleri,
        ];
        return allPeople.some(person => nameMatches(person, firstName, lastName));
    });

    const kategoriler: Record<string, number> = {};
    for (const m of userMatches) kategoriler[m.kategori] = (kategoriler[m.kategori] || 0) + 1;

    return { toplam_mac: userMatches.length, kategoriler, maclar: userMatches };
}
