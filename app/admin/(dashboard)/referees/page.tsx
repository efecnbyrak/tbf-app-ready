import { db } from "@/lib/db";
import { RefereeListClient } from "./RefereeListClient";
import { verifySession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function RefereesPage() {
    const session = await verifySession();

    // Run user-email lookup and full referee fetch in parallel
    const [currentUserWithEmail, referees] = await Promise.all([
        db.user.findUnique({
            where: { id: session.userId },
            select: {
                username: true,
                referee: { select: { email: true } },
                official: { select: { email: true } }
            }
        }),
        db.referee.findMany({
            include: {
                user: {
                    include: {
                        penalties: true,
                        role: true
                    }
                },
                regions: true,
                assignments: {
                    include: { match: true },
                    orderBy: { match: { date: 'desc' } },
                    take: 5
                },
                _count: { select: { assignments: true } }
            },
            orderBy: { createdAt: 'desc' }
        }),
    ]);

    const currentUserEmail = currentUserWithEmail?.referee?.email
        || currentUserWithEmail?.official?.email
        || currentUserWithEmail?.username
        || "";

    // Make data plain for client component
    const plainReferees = JSON.parse(JSON.stringify(referees));
    // Every referee entry is type "REFEREE" — no need for a dynamic map
    const refereeTypeMap: Record<string, string> = Object.fromEntries(
        referees.map(r => [r.id, "REFEREE"])
    );

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Hakem Yönetimi</h1>
                    <p className="text-zinc-500 font-medium mt-1">Klasman bazlı gruplandırma ve gelişmiş arama sistemi.</p>
                </div>
            </header>

            <RefereeListClient
                initialReferees={plainReferees}
                refereeTypeMap={refereeTypeMap}
                currentUserRole={session.role}
                currentUserEmail={currentUserEmail}
            />
        </div>
    );
}
