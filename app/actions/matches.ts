"use server";

import { verifySession } from "@/lib/session";
import { getUserMatchesStore } from "@/lib/matches-store";

export async function getUpcomingUserMatches() {
    try {
        const session = await verifySession();
        if (!session?.userId) return { success: false, matches: [] };

        const cached = await getUserMatchesStore(session.userId);
        if (!cached || !cached.matches || cached.matches.length === 0) {
            return { success: true, matches: [] };
        }

        const now = new Date();

        const upcomingMatches = cached.matches.filter(match => {
            if (!match.tarih) return false;
            // Parse DD.MM.YYYY string
            const dateMatch = match.tarih.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/);
            if (!dateMatch) return false;
            
            const [, day, month, year] = dateMatch;
            const matchDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            
            // If match has a time, apply the 1-hour rule:
            // Match is "played" if current time > matchTime + 1 hour
            if (match.saat) {
                const parts = match.saat.split(/[:.]/);
                if (parts.length >= 2) {
                    const h = parseInt(parts[0], 10);
                    const m = parseInt(parts[1], 10);
                    if (!isNaN(h) && !isNaN(m)) {
                        const matchDateTime = new Date(matchDate);
                        matchDateTime.setHours(h + 1, m, 0, 0); // +1 hour
                        return now < matchDateTime; // still upcoming if now < matchTime + 1h
                    }
                }
            }

            // No time info — compare date only (start of next day)
            const nextDay = new Date(matchDate);
            nextDay.setDate(nextDay.getDate() + 1);
            return now < nextDay;
        });

        // Sort upcoming matches by date+time (nearest first)
        upcomingMatches.sort((a, b) => {
            const parseDateTime = (m: any) => {
                const dm = m.tarih.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/);
                if (!dm) return 0;
                const d = new Date(parseInt(dm[3]), parseInt(dm[2]) - 1, parseInt(dm[1]));
                if (m.saat) {
                    const parts = m.saat.split(/[:.]/);
                    if (parts.length >= 2) {
                        d.setHours(parseInt(parts[0], 10) || 0, parseInt(parts[1], 10) || 0);
                    }
                }
                return d.getTime();
            };
            return parseDateTime(a) - parseDateTime(b);
        });

        return { success: true, matches: upcomingMatches };
    } catch (error) {
        console.error("Error fetching upcoming matches:", error);
        return { success: false, matches: [] };
    }
}
