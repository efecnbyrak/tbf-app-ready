import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getAllMatches, getMatchesForUser, MatchData } from "@/lib/match-parser";
import { getUserMatchesStore, saveUserMatchesStore, getGlobalMatchesStore, saveGlobalMatchesStore } from "@/lib/matches-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Folder structure:
 *
 * 📁 2025-2026 Maç Programları (0ByPao_qBUjN-YXJZSG5Fancybmc)        ← "current" — has 26/27.HAFTA + OKUL + ÖZEL LİG etc.
 *   📊 27.HAFTA, 26.HAFTA, OKUL İL VE İLÇE, ÖZEL LİG, TBF-FIBA...
 *   📁 Arşiv → (circle ref, skip)
 *
 * 📁 Arşiv (1wW7_ITBS2JWRHQqpBH1xq926070U2WQP)
 *   📁 2025-2026 Sezonu (1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s)         ← has weeks 1-25
 *   📁 2024-2025 Sezonu (12ugwc-i-fQEKbqfS-qbUtaYvz3ozTIsh)
 *   📁 2023-2024 Sezonu (1UyODoUB5Qsix6J-VqkD40OcmvFsBKTWm)
 *   📁 2022-2023 Sezonu (1h9aPtw5t_Q7WOyhx39LJAgMKbvixzI0k)
 *   📁 2021-2022 Sezonu (1-0-qvqZRfoVImZcgzHLgUwpAd35FaNZ4)
 */
const SEASON_FOLDERS: Record<string, string> = {
    // Current season — latest weekly files + special spreadsheets (OKUL, ÖZEL LİG etc.)
    "current": "0ByPao_qBUjN-YXJZSG5Fancybmc?resourcekey=0-MKTgAd4XnpTp7S5flJBKuA",
    // Archive 2025-2026 — earlier weekly files (1-25.HAFTA etc.)
    "2025-2026": "1Tqtn2oN96UAyeARYtmYFGSfzkrSJOG9s",
    // Older seasons
    "2024-2025": "12ugwc-i-fQEKbqfS-qbUtaYvz3ozTIsh",
    "2023-2024": "1UyODoUB5Qsix6J-VqkD40OcmvFsBKTWm",
    "2022-2023": "1h9aPtw5t_Q7WOyhx39LJAgMKbvixzI0k",
    "2021-2022": "1-0-qvqZRfoVImZcgzHLgUwpAd35FaNZ4",
};

// Current season archive changes actively — always re-scan it
const CURRENT_SEASON_ARCHIVE = "2025-2026";
// Old seasons are scanned ONCE and permanently cached
const OLD_ARCHIVE_SEASONS = ["2024-2025", "2023-2024", "2022-2023", "2021-2022"];
const ALL_ARCHIVE_SEASONS = [CURRENT_SEASON_ARCHIVE, ...OLD_ARCHIVE_SEASONS];

// Defined at module scope to avoid recreating on every request
function normalizeName(first: string, last: string): string {
    return `${first} ${last}`.replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç").toLowerCase().replace(/\s+/g, " ").trim();
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get("refresh") === "true";
        const seasonParam = searchParams.get("season");

        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { referee: true, official: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const firstName = user.referee?.firstName || user.official?.firstName || "";
        const lastName = user.referee?.lastName || user.official?.lastName || "";

        if (!firstName || !lastName) {
            return NextResponse.json({ error: "Profil bilgileri eksik." }, { status: 400 });
        }

        // ========================================
        // MODE: Archive season scan (?season=2024-2025)
        // ========================================
        if (seasonParam && SEASON_FOLDERS[seasonParam]) {
            console.log(`[MATCHES] Archive scan: ${seasonParam} for ${firstName} ${lastName}`);

            const folderId = SEASON_FOLDERS[seasonParam];
            // maxDepth=2: season folder → weekly subfolders → spreadsheets
            const { matches: seasonMatches, hasErrors: archiveHadErrors } = await getAllMatches([folderId], 2);
            console.log(`[MATCHES] ${seasonParam}: ${seasonMatches.length} total matches found`);

            // If Drive errored out and returned nothing, skip saving to avoid wiping archive cache
            const existing = await getUserMatchesStore(session.userId);
            const existingMatchesArchive = existing?.matches || [];

            if (archiveHadErrors && seasonMatches.length === 0) {
                console.log(`[MATCHES] ${seasonParam}: Drive error, skipping save`);
                return NextResponse.json({
                    season: seasonParam,
                    newMatchesFound: 0,
                    totalSeasonMatches: 0,
                    totalAfterMerge: existingMatchesArchive.length,
                    matches: existingMatchesArchive,
                    lastSync: existing?.lastSync || new Date().toISOString(),
                    driveError: true,
                });
            }

            const userResults = getMatchesForUser(seasonMatches, firstName, lastName);
            console.log(`[MATCHES] ${seasonParam}: ${userResults.toplam_mac} matches for user`);

            // Tag matches with the season they came from
            const taggedMatches = userResults.maclar.map(m => ({ ...m, sezon: seasonParam }));

            // Replace matches for this season in existing cache
            const merged = mergeMatches(existingMatchesArchive, taggedMatches, seasonParam);

            const existingSeasons = existing?.scannedSeasons || [];
            await saveUserMatchesStore(session.userId, merged, false, [...existingSeasons, seasonParam]).catch(() => { });

            return NextResponse.json({
                season: seasonParam,
                newMatchesFound: userResults.toplam_mac,
                totalSeasonMatches: seasonMatches.length,
                totalAfterMerge: merged.length,
                matches: merged,
                lastSync: new Date().toISOString(),
            });
        }

        // ========================================
        // MODE: Normal load (current season + auto archive)
        // ========================================

        // Step 1: Read cache and phone data in parallel — both are needed regardless of cache state.
        // Running them concurrently saves ~40ms per request compared to sequential awaits.
        const [cached, allReferees, allOfficials] = await Promise.all([
            getUserMatchesStore(session.userId),
            db.referee.findMany({ select: { firstName: true, lastName: true, phone: true } }),
            db.generalOfficial.findMany({ select: { firstName: true, lastName: true, phone: true } }),
        ]);

        const existingMatches = cached?.matches || [];

        let pendingSeasons: string[] = [];

        if (existingMatches.length > 0) {
            // Returning user (both normal and force refresh): scan ONLY current season archive
            // Old seasons are ignored permanently
            pendingSeasons = [CURRENT_SEASON_ARCHIVE];
        } else {
            // First-time user: scan everything
            pendingSeasons = [...ALL_ARCHIVE_SEASONS];
        }

        const personnelPhones: Record<string, string> = {};

        allReferees.forEach(r => {
            if (r.phone) personnelPhones[normalizeName(r.firstName, r.lastName)] = r.phone;
        });
        allOfficials.forEach(o => {
            if (o.phone) personnelPhones[normalizeName(o.firstName, o.lastName)] = o.phone;
        });

        // If NOT forcing a refresh, and we have SOME cached data, just return it
        // The client will auto-trigger a background refresh for the current season if it wants to.
        if (!forceRefresh && existingMatches.length > 0) {
            return NextResponse.json({
                matches: existingMatches,
                lastSync: cached?.lastSync,
                fromCache: true,
                searchName: `${firstName} ${lastName}`,
                scannedSeasons: cached?.scannedSeasons || [],
                pendingSeasons: pendingSeasons, // Only trigger scans for missing archives
                personnelPhones
            });
        }

        // Step 2: No cache (or forced refresh) — scan current season from Drive
        console.log(`[MATCHES] Fresh scan for: ${firstName} ${lastName} (forceRefresh: ${forceRefresh})`);

        const currentFolder = SEASON_FOLDERS["current"];
        const { matches: allMatches, hasErrors: driveHadErrors } = await getAllMatches([currentFolder], 0);
        console.log(`[MATCHES] Current season: ${allMatches.length} matches total`);

        // If Drive returned 0 results due to errors, preserve the existing cache instead of wiping it
        if (driveHadErrors && allMatches.length === 0 && existingMatches.length > 0) {
            console.log(`[MATCHES] Drive scan failed, preserving existing cache (${existingMatches.length} matches)`);
            return NextResponse.json({
                matches: existingMatches,
                lastSync: cached?.lastSync,
                fromCache: true,
                driveError: true,
                searchName: `${firstName} ${lastName}`,
                scannedSeasons: cached?.scannedSeasons || [],
                pendingSeasons: [],
                personnelPhones
            });
        }

        // Save global registry
        await saveGlobalMatchesStore(allMatches, false).catch(e =>
            console.error("[MATCHES] Global save error:", e.message)
        );

        // Filter for user
        const userResults = getMatchesForUser(allMatches, firstName, lastName);
        console.log(`[MATCHES] User matches in current season: ${userResults.toplam_mac}`);

        // Tag current season matches
        const taggedCurrentMatches = userResults.maclar.map(m => ({ ...m, sezon: "current" }));

        // On force refresh, replace current-season matches entirely (fresh scan is authoritative).
        // On normal load without cache, just merge. Either way, archive-tagged matches are preserved.
        const finalMerged = forceRefresh
            ? mergeMatches(existingMatches, taggedCurrentMatches, "current")
            : mergeMatches(existingMatches, taggedCurrentMatches);

        // Save to user cache — preserve old season scan status even on force refresh
        const seasonsToSave = cached?.scannedSeasons || [];
        await saveUserMatchesStore(session.userId, finalMerged, false, seasonsToSave).catch(e =>
            console.error("[MATCHES] User save error:", e.message)
        );

        return NextResponse.json({
            matches: finalMerged,
            lastSync: new Date().toISOString(),
            fromCache: false,
            searchName: `${firstName} ${lastName}`,
            scannedSeasons: seasonsToSave,
            pendingSeasons: pendingSeasons,  // Client will trigger only needed archive scans
            personnelPhones
        });

    } catch (error: any) {
        console.error("[MATCHES API] Error:", error?.message, error?.stack);
        return NextResponse.json({
            error: "Maç verileri yüklenirken bir hata oluştu.",
        }, { status: 500 });
    }
}

// ============================================================
// Helpers
// ============================================================

function mergeMatches(existing: MatchData[], incoming: MatchData[], seasonToReplace?: string): MatchData[] {
    // If replacing a specific season, remove old matches from that season first
    let base = existing;
    if (seasonToReplace) {
        base = existing.filter(m => m.sezon !== seasonToReplace);
    }

    const merged = [...base];
    const seen = new Set<string>();
    merged.forEach(m => seen.add(matchKey(m)));

    for (const m of incoming) {
        const key = matchKey(m);
        if (!seen.has(key)) {
            merged.push(m);
            seen.add(key);
        }
    }
    return merged;
}

function normalize(s: string): string {
    return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function matchKey(m: MatchData): string {
    // Use normalized fields for robust dedup
    const hakems = [...m.hakemler].map(normalize).sort().join(",");
    const masa = [...m.masa_gorevlileri].map(normalize).sort().join(",");
    return `${normalize(m.mac_adi)}|${normalize(m.tarih)}|${normalize(m.saat || "")}|${normalize(m.salon || "")}|${hakems}|${masa}`;
}
