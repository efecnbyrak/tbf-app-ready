
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
    const official = await db.generalOfficial.findUnique({
        where: { userId: session.userId }
    });
    const realOfficialType = official?.officialType || "TABLE";
    const realFirstName = official?.firstName || "Kullanıcı";

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
