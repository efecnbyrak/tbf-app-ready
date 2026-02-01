
import { ResponsiveNav } from "@/app/referee/ResponsiveNav";

// In server components, layouts can fetch data too.
// We'll get the session to show the name or TBF header.
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function OfficialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    // Fetch details (Name etc.)
    // Ideally middleware ensures this but safe to check
    // Workaround: Fetch officialType via raw Query
    const rawData = await db.$queryRaw<Array<{ officialType: string, firstName: string }>>`
        SELECT "officialType", "firstName" FROM referees WHERE "userId" = ${session.userId}
    `;
    const realOfficialType = rawData[0]?.officialType || "REFEREE";
    const realFirstName = rawData[0]?.firstName || "Kullanıcı";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            <ResponsiveNav
                refereeName={realFirstName}
                roleType={realOfficialType}
                basePath="/general"
            />

            <main className="flex-1 md:pl-64 p-4 md:p-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
