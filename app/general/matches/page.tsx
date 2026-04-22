import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "@/app/referee/matches/MatchesClient";
import { nameMatches } from "@/lib/match-parser";

export const dynamic = "force-dynamic";

export default async function GeneralMatchesPage() {
    const session = await verifySession();

    const user = await db.user.findUnique({
        where: { id: session.userId },
        select: {
            referee: { select: { firstName: true, lastName: true } },
            official: { select: { firstName: true, lastName: true } }
        },
    });

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";

    const isEfeCan = nameMatches("Efe Can Bayrak", firstName, lastName);

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

    return (
        <MatchesClient
            firstName={firstName}
            lastName={lastName}
        />
    );
}
