import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "./MatchesClient";
import { redirect } from "next/navigation";
import { getUserMatchesStore } from "@/lib/matches-store";

export const dynamic = "force-dynamic";

function normalizeTR(str: string) {
    return str
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç")
        .toLowerCase().replace(/\s+/g, " ").trim();
}

export default async function MatchesPage() {
    const session = await verifySession();

    const [user, cachedStore, allReferees, allOfficials] = await Promise.all([
        db.user.findUnique({
            where: { id: session.userId },
            include: { referee: true, official: true },
        }),
        getUserMatchesStore(session.userId).catch(() => null),
        db.referee.findMany({ select: { firstName: true, lastName: true, phone: true } }),
        db.generalOfficial.findMany({ select: { firstName: true, lastName: true, phone: true } })
    ]);

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";

    const fullName = normalizeTR(`${firstName} ${lastName}`);
    const isEfeCan = fullName === normalizeTR("Efe Can Bayrak");

    if (!isEfeCan) {
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

    const personnelPhones: Record<string, string> = {};
    const normalizeName = (first: string, last: string) => {
        return `${first} ${last}`.replace(/İ/g, "i").replace(/I/g, "ı")
            .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
            .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
            .replace(/Ç/g, "ç").toLowerCase().replace(/\s+/g, " ").trim();
    };

    allReferees.forEach(r => {
        if (r.phone) personnelPhones[normalizeName(r.firstName, r.lastName)] = r.phone;
    });
    allOfficials.forEach(o => {
        if (o.phone) personnelPhones[normalizeName(o.firstName, o.lastName)] = o.phone;
    });

    return (
        <MatchesClient
            firstName={firstName}
            lastName={lastName}
            initialMatches={cachedStore?.matches || []}
            initialLastSync={cachedStore?.lastSync || null}
            initialPersonnelPhones={personnelPhones}
        />
    );
}
