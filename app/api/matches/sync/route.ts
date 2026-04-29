import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getAllMatches, getMatchesForUser, MatchData } from "@/lib/match-parser";
import { getUserMatchesStore, saveUserMatchesStore } from "@/lib/matches-store";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow 1 minute for full Drive + Archive scan

export async function GET() {
    try {
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

        // 1. Get Folder IDs from Env
        const folderIds = (process.env.GOOGLE_DRIVE_FOLDER_ID || "")
            .split(",").map((s: string) => s.trim()).filter(Boolean);

        // 2. Perform Full Sync (Drive + Local Archive)
        const { matches: allMatches } = await getAllMatches(folderIds);

        // 3. Filter for this user
        const newSummary = getMatchesForUser(allMatches, firstName, lastName);

        // 4. Accumulate: Merge Drive results with existing storage
        const existingStore = await getUserMatchesStore(session.userId);
        const onlineMatches = newSummary.maclar;

        let mergedMatches: MatchData[] = existingStore ? [...existingStore.matches] : [];
        let hasNewFlag = existingStore?.hasNew || false;
        let newFoundCount = 0;

        // Create a map for quick lookup by unique key
        const matchMap = new Map<string, number>();
        mergedMatches.forEach((m, idx) => {
            const key = `${m.mac_adi}-${m.tarih}-${m.saat}`;
            matchMap.set(key, idx);
        });

        // Merge online matches
        for (const online of onlineMatches) {
            const key = `${online.mac_adi}-${online.tarih}-${online.saat}`;
            if (matchMap.has(key)) {
                // Update existing match with latest online data (roles might change)
                const index = matchMap.get(key)!;
                mergedMatches[index] = online;
            } else {
                // New match found!
                mergedMatches.push(online);
                hasNewFlag = true;
                newFoundCount++;
            }
        }

        // 5. Save the merged (cumulative) list
        await saveUserMatchesStore(session.userId, mergedMatches, hasNewFlag);

        return NextResponse.json({
            success: true,
            onlineCount: onlineMatches.length,
            totalPersistentCount: mergedMatches.length,
            newFoundCount,
            hasNew: hasNewFlag,
            lastSync: new Date().toISOString()
        });

    } catch (error: any) {
        console.error("[SYNC API] Error:", error?.message);
        return NextResponse.json({ error: error?.message }, { status: 500 });
    }
}
