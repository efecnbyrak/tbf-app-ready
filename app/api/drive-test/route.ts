import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getAllMatches, getMatchesForUser } from "@/lib/match-parser";
import { parseDriveId, findAllSpreadsheets } from "@/lib/google-drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getCredentials() {
    let jsonStr = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!jsonStr) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON ayarlanmamış.");

    if ((jsonStr.startsWith("'") && jsonStr.endsWith("'")) ||
        (jsonStr.startsWith('"') && jsonStr.endsWith('"'))) {
        jsonStr = jsonStr.substring(1, jsonStr.length - 1);
    }

    try {
        return JSON.parse(jsonStr);
    } catch (e: any) {
        if (e.message.includes("control character") || e.message.includes("newline") || e.message.includes("Unexpected token")) {
            const escaped = jsonStr.replace(/\n/g, "\\n").replace(/\r/g, "\\r");
            return JSON.parse(escaped);
        }
        throw e;
    }
}

/**
 * Active season folder ID — same as matches API
 */
const ACTIVE_SEASON_FOLDER = "0ByPao_qBUjN-YXJZSG5Fancybmc?resourcekey=0-MKTgAd4XnpTp7S5flJBKuA";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    const mode = searchParams.get("mode") || "folders";
    const userName = searchParams.get("name") || "";

    if (secret !== "tbf2026") {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 403 });
    }

    const folderIds = (process.env.GOOGLE_DRIVE_FOLDER_ID || "").split(",").map((s: string) => s.trim()).filter(Boolean);

    // ========================================
    // Mode: env
    // ========================================
    if (mode === "env") {
        let jsonValid = false;
        let jsonError = "";
        let clientEmail = "";
        try {
            const creds = getCredentials();
            jsonValid = true;
            clientEmail = creds.client_email || "(yok)";
        } catch (e: any) {
            jsonError = e.message;
        }

        return NextResponse.json({
            success: true,
            env: {
                GOOGLE_SERVICE_ACCOUNT_JSON: jsonValid ? "✅ Mevcut (Valid JSON)" : `❌ INVALID: ${jsonError}`,
                GOOGLE_DRIVE_FOLDER_ID: `✅ ${folderIds.length} klasör`,
                GOOGLE_DRIVE_RESOURCE_KEY: process.env.GOOGLE_DRIVE_RESOURCE_KEY ? `✅ ${process.env.GOOGLE_DRIVE_RESOURCE_KEY}` : "⚠️ YOK",
                client_email: clientEmail,
            },
            folderIds: folderIds.map(id => {
                const parsed = parseDriveId(id);
                return { raw: id, parsedId: parsed.id, resourceKey: parsed.resourceKey || "(yok)" };
            }),
        });
    }

    // ========================================
    // Mode: folders
    // ========================================
    if (mode === "folders") {
        try {
            const credentials = getCredentials();
            const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
            const drive = google.drive({ version: "v3", auth });

            const log: string[] = [];
            for (const inputId of folderIds) {
                const { id: fid, resourceKey: rk } = parseDriveId(inputId);
                log.push(`\n--- Folder: ${fid}${rk ? `?resourcekey=${rk}` : ""} ---`);
                const headers: any = {};
                if (rk) headers["X-Goog-Drive-Resource-Keys"] = `${fid}/${rk}`;

                try {
                    const meta: any = await drive.files.get({ fileId: fid, fields: "name, mimeType", supportsAllDrives: true }, { headers } as any);
                    log.push(`✅ ${meta.data.name} (${meta.data.mimeType})`);

                    const r: any = await drive.files.list({
                        q: `'${fid}' in parents and trashed = false`,
                        fields: "files(id, name, mimeType)", pageSize: 100,
                        supportsAllDrives: true, includeItemsFromAllDrives: true,
                    }, { headers } as any);

                    const files = r.data.files || [];
                    log.push(`   → ${files.length} dosya/klasör bulundu`);
                    files.forEach((f: any) => {
                        log.push(`   ${f.mimeType?.includes("folder") ? "📁" : "📊"} ${f.name} (ID: ${f.id})`);
                    });
                } catch (e: any) {
                    log.push(`❌ ${e.message}`);
                }
            }
            return NextResponse.json({ success: true, log });
        } catch (e: any) {
            return NextResponse.json({ success: false, error: e.message }, { status: 500 });
        }
    }

    // ========================================
    // Mode: scan — find spreadsheets (current season only, no recursion)
    // ========================================
    if (mode === "scan") {
        try {
            const { files, errors } = await findAllSpreadsheets([ACTIVE_SEASON_FOLDER], 0);
            return NextResponse.json({
                success: true,
                totalFiles: files.length,
                files: files.map(f => ({ name: f.name, id: f.id, mimeType: f.mimeType })),
                errors,
            });
        } catch (e: any) {
            return NextResponse.json({ success: false, error: e.message }, { status: 500 });
        }
    }

    // ========================================
    // Mode: parse — parse current season matches (no archive = no timeout)
    // ========================================
    if (mode === "parse") {
        try {
            const startTime = Date.now();
            // Only scan active season folder, maxDepth=0
            const allMatches = await getAllMatches([ACTIVE_SEASON_FOLDER], 0);
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);

            const allPeople = [...new Set(allMatches.flatMap(m => [
                ...m.hakemler, ...m.masa_gorevlileri,
                ...m.saglikcilar, ...m.istatistikciler, ...m.gozlemciler
            ]))].sort();

            let userResults = null;
            if (userName) {
                const parts = userName.split(" ");
                if (parts.length >= 2) {
                    const ln = parts[parts.length - 1];
                    const fn = parts.slice(0, -1).join(" ");
                    userResults = getMatchesForUser(allMatches, fn, ln);
                }
            }

            return NextResponse.json({
                success: true,
                duration: `${duration}s`,
                totalMatches: allMatches.length,
                totalPeople: allPeople.length,
                sample: allMatches.slice(0, 3),
                peopleSample: allPeople.slice(0, 30),
                categories: [...new Set(allMatches.map(m => m.kategori))],
                ligTypes: [...new Set(allMatches.map(m => m.ligTuru))],
                userResults: userResults ? {
                    name: userName,
                    totalMatches: userResults.toplam_mac,
                    categories: userResults.kategoriler,
                    matchesSample: userResults.maclar.slice(0, 5),
                } : null,
            });
        } catch (e: any) {
            return NextResponse.json({ success: false, error: e.message, stack: e.stack }, { status: 500 });
        }
    }

    return NextResponse.json({
        availableModes: { env: "Ortam değişkenleri", folders: "Klasör listesi", scan: "Spreadsheet bul", parse: "Maç parse (?name=İsim)" },
        usage: "/api/drive-test?secret=tbf2026&mode=folders"
    });
}
