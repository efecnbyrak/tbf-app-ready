import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserMatchesStore } from "@/lib/matches-store";

export const dynamic = "force-dynamic";

/**
 * Quick notification check: does the user have upcoming matches?
 * Called by ResponsiveNav every 2 minutes to show bell icon.
 */
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ hasNew: false });
        }

        const cached = await getUserMatchesStore(session.userId);
        if (!cached || !cached.matches || cached.matches.length === 0) {
            return NextResponse.json({ hasNew: false });
        }

        // Check if any match has a future date
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const hasUpcoming = cached.matches.some(match => {
            if (!match.tarih) return false;
            const dateMatch = match.tarih.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/);
            if (!dateMatch) return false;
            const [, day, month, year] = dateMatch;
            const matchDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            return matchDate >= now;
        });

        return NextResponse.json({
            hasNew: hasUpcoming,
            totalMatches: cached.matches.length,
        }, {
            headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
        });
    } catch (e) {
        return NextResponse.json({ hasNew: false });
    }
}
