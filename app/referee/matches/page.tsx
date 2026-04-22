import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "./MatchesClient";
import { getUserMatchesStore } from "@/lib/matches-store";

export const dynamic = "force-dynamic";

function normalizeNameStr(first: string, last: string) {
    return `${first} ${last}`
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç").toLowerCase().replace(/\s+/g, " ").trim();
}

function isEfeCanBayrak(firstName: string, lastName: string): boolean {
    const full = normalizeNameStr(firstName, lastName);
    const tokens = full.split(/\s+/).filter(Boolean);
    // Must contain all three: efe, can, bayrak (any order, possibly with extra name tokens)
    return tokens.includes("efe") && tokens.includes("can") && tokens.includes("bayrak");
}

export default async function MatchesPage() {
    const session = await verifySession();

    const [user, cachedStore] = await Promise.all([
        db.user.findUnique({
            where: { id: session.userId },
            select: {
                referee: { select: { firstName: true, lastName: true } },
                official: { select: { firstName: true, lastName: true } }
            },
        }),
        getUserMatchesStore(session.userId).catch(() => null),
    ]);

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";

    if (!isEfeCanBayrak(firstName, lastName)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
                    <div className="text-5xl mb-4">🔒</div>
                    <h2 className="text-xl font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Maçlarım Geçici Olarak Kapalı</h2>
                    <p className="text-yellow-700 dark:text-yellow-400 text-sm">Bu bölüm şu an bakım nedeniyle geçici olarak devre dışı bırakılmıştır. Kısa süre içinde tekrar kullanıma açılacaktır.</p>
                </div>
            </div>
        );
    }

    // Collect all personnel names from this user's matches to query only what's needed
    const matches = cachedStore?.matches || [];
    const personnelPhones: Record<string, string> = {};

    if (matches.length > 0) {
        const allNames = new Set<string>();
        for (const m of matches) {
            [...(m.hakemler || []), ...(m.masa_gorevlileri || []), ...(m.saglikcilar || []),
             ...(m.istatistikciler || []), ...(m.gozlemciler || [])].forEach(n => allNames.add(n));
        }

        // Build first/last name pairs from normalized full names for DB filtering
        const nameParts = [...allNames].map(n => {
            const parts = n.trim().split(/\s+/);
            return { firstName: parts[0] || "", lastName: parts.slice(1).join(" ") || "" };
        }).filter(p => p.firstName && p.lastName);

        if (nameParts.length > 0) {
            const [referees, officials] = await Promise.all([
                db.referee.findMany({
                    where: { OR: nameParts.map(p => ({ firstName: p.firstName, lastName: p.lastName })) },
                    select: { firstName: true, lastName: true, phone: true }
                }),
                db.generalOfficial.findMany({
                    where: { OR: nameParts.map(p => ({ firstName: p.firstName, lastName: p.lastName })) },
                    select: { firstName: true, lastName: true, phone: true }
                }),
            ]);

            referees.forEach(r => {
                if (r.phone) personnelPhones[normalizeNameStr(r.firstName, r.lastName)] = r.phone;
            });
            officials.forEach(o => {
                if (o.phone) personnelPhones[normalizeNameStr(o.firstName, o.lastName)] = o.phone;
            });
        }
    }

    return (
        <MatchesClient
            firstName={firstName}
            lastName={lastName}
            initialMatches={matches}
            initialLastSync={cachedStore?.lastSync || null}
            initialPersonnelPhones={personnelPhones}
        />
    );
}
