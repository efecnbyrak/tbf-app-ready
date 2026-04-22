
import { getSession } from "@/lib/session";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { redirect } from "next/navigation";
import { ensureSchemaColumns } from "@/lib/db-heal";
import { db } from "@/lib/db";
import { Suspense } from "react";
import { RefereeNavWrapper } from "@/app/referee/components/RefereeNavWrapper";
import { ResponsiveNav } from "@/app/referee/ResponsiveNav";

import { UpcomingMatchPopup } from "@/components/matches/UpcomingMatchPopup";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();
    await ensureSchemaColumns();

    // Secure the admin area
    if (!session || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        redirect("/basket/admin/login");
    }

    const userDetails = await db.user.findUnique({
        where: { id: session.userId },
        include: {
            referee: { select: { firstName: true, lastName: true, classification: true, imageUrl: true } },
            official: { select: { firstName: true, lastName: true, officialType: true, imageUrl: true } }
        }
    });

    // Check if it's an Official Admin (Observer/Referee with admin rights)
    // SUPER_ADMIN ALWAYS sees the master sidebar.
    // Anyone ELSE who is an ADMIN/ADMIN_IHK AND has a profile gets the restricted official sidebar.
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const hasProfile = !!(userDetails?.referee || userDetails?.official);

    if (!isSuperAdmin && hasProfile) {
        const roleType = userDetails?.referee ? "REFEREE" : (userDetails?.official as any)?.officialType;

        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
                <Suspense fallback={
                    <ResponsiveNav
                        refereeName="..."
                        roleType={roleType}
                        basePath="/admin"
                        isAdminObserver={true}
                    />
                }>
                    <RefereeNavWrapper userId={session.userId} basePath="/admin" />
                </Suspense>

                <main className="flex-1 md:pl-80 flex flex-col min-h-screen relative w-full">
                    <div className="flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-24 pt-24 md:pt-16 w-full transition-all duration-500">
                        <div className="max-w-[1400px] mx-auto w-full">
                            {children}
                        </div>
                    </div>

                    <UpcomingMatchPopup />

                    <footer className="p-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-xs mt-auto">
                        <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 italic font-bold">
                            <span>© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</span>
                        </div>
                    </footer>
                </main>
            </div>
        );
    }

    const imageUrl = userDetails?.referee?.imageUrl || userDetails?.official?.imageUrl || null;

    return (
        <AdminLayoutClient role={session.role} imageUrl={imageUrl}>
            {children}
            <UpcomingMatchPopup />
        </AdminLayoutClient>
    );
}
