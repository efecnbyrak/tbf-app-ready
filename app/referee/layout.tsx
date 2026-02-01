
import { ResponsiveNav } from "./ResponsiveNav";

// In server components, layouts can fetch data too.
// We'll get the session to show the name or TBF header.
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function RefereeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    // Fetch details (Name etc.)
    // Ideally middleware ensures this but safe to check
    const referee = await db.referee.findUnique({
        where: { userId: session.userId }
    });

    // If referee is null (maybe Admin logged in? Middleware handles it but type safety)
    // Just show generic if not found.

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            <ResponsiveNav
                refereeName={referee?.firstName || "Kullanıcı"}
                roleType={referee?.officialType || "REFEREE"}
            />

            <main className="flex-1 md:pl-64 p-4 md:p-8 overflow-x-hidden">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
