import { db } from "@/lib/db";
import { OfficialCard } from "@/components/admin/OfficialCard";

export const dynamic = 'force-dynamic';

export default async function RefereesPage() {
    // Fetch Referee Types manually via Raw Query to bypass stale Prisma Client
    const refereeTypesRaw = await db.$queryRaw<Array<{ id: number, officialType: string }>>`
        SELECT id, "officialType" FROM referees
    `;
    const refereeTypeMap = new Map(refereeTypesRaw.map((r: any) => [r.id, r.officialType || "REFEREE"]));

    // Fetch all referees and filter in memory
    const allReferees = await db.referee.findMany({
        include: { user: true, regions: true },
        orderBy: { createdAt: 'desc' }
    });

    const referees = allReferees.filter(ref => refereeTypeMap.get(ref.id) === "REFEREE");

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Hakem Yönetimi</h1>
                    <p className="text-zinc-500 mt-1">Sistemdeki tüm kayıtlı hakemleri görüntüleyin ve düzeltin.</p>
                </div>
                {/* Total Count */}
                <div className="bg-white dark:bg-zinc-800 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-medium">
                    Toplam: {referees.length}
                </div>
            </header>

            {referees.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border dashed border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500">Henüz kayıtlı hakem bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {referees.map((ref) => (
                        <OfficialCard
                            key={ref.id}
                            official={{
                                ...ref,
                                officialType: refereeTypeMap.get(ref.id) || "REFEREE"
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
