import { db } from "@/lib/db";
import { RefereeListClient } from "./RefereeListClient";
import { ensureSchemaColumns } from "@/app/actions/auth";
import { verifySession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function RefereesPage() {
    await ensureSchemaColumns();
    const session = await verifySession();

    // Fetch referees directly with 'REFEREE' filter at DB level (Performance Optimization)
    const referees = await db.referee.findMany({
        where: {
            officialType: 'REFEREE'
        },
        include: {
            user: true,
            regions: true,
            assignments: {
                include: {
                    match: true
                },
                orderBy: {
                    match: {
                        date: 'desc'
                    }
                },
                take: 5
            },
            _count: {
                select: { assignments: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Re-construct the map for component compatibility (Fixed for Client Component)
    const refereeTypeMap: Record<string, string> = {};
    referees.forEach(r => {
        refereeTypeMap[r.id] = r.officialType || "REFEREE";
    });

    // Make data plain for client component
    const plainReferees = JSON.parse(JSON.stringify(referees));

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
            />
        </div>
    );
}
