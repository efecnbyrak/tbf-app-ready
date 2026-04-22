import { verifySession } from "@/lib/session";
import { Suspense } from "react";
import { RefereeNavWrapper } from "./components/RefereeNavWrapper";
import Link from "next/link";
import { ResponsiveNav } from "./ResponsiveNav";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings-cache";

import { IBANRequirementModal } from "@/components/IBANRequirementModal";
import { MandatoryAnnouncementModal } from "@/components/announcements/MandatoryAnnouncementModal";
import { UpcomingMatchPopup } from "@/components/matches/UpcomingMatchPopup";

export default async function RefereeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    const [user, ibanValue] = await Promise.all([
        db.user.findUnique({
            where: { id: session.userId },
            select: {
                referee: { select: { firstName: true, lastName: true, imageUrl: true, iban: true } },
                official: { select: { firstName: true, lastName: true, imageUrl: true, iban: true, officialType: true } },
            }
        }),
        getSetting("IBAN_COLLECTION_ENABLED")
    ]);

    const currentUserName = user?.referee
        ? `${user.referee.firstName} ${user.referee.lastName}`
        : user?.official
            ? `${user.official.firstName} ${user.official.lastName}`
            : session.userId.toString();

    const ibanRequired = ibanValue === "true";
    const userIban = user?.referee?.iban || user?.official?.iban;
    const showIbanModal = ibanRequired && !userIban;

    // Resolve nav data here so RefereeNavWrapper can skip duplicate DB queries
    const navName = user?.referee?.firstName || user?.official?.firstName || "Kullanıcı";
    const navRoleType = user?.referee ? "REFEREE" : (user?.official?.officialType || "REFEREE");
    const navImageUrl = user?.referee?.imageUrl || user?.official?.imageUrl || null;
    const navBasePath = user?.referee ? "/referee" : "/general";

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            <Suspense fallback={
                <ResponsiveNav
                    refereeName="..."
                    roleType="REFEREE"
                />
            }>
                <RefereeNavWrapper
                    userId={session.userId}
                    role={session.role}
                    preloadedName={navName}
                    preloadedRoleType={navRoleType}
                    preloadedImageUrl={navImageUrl}
                    preloadedBasePath={navBasePath}
                />
            </Suspense>

            <main className="flex-1 md:pl-72 flex flex-col min-h-screen">
                <div className="flex-1 p-4 md:p-8 pt-16 md:pt-8 w-full">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>

                <IBANRequirementModal isOpen={showIbanModal} />
                <MandatoryAnnouncementModal />
                <UpcomingMatchPopup />

                {/* Dashboard Footer */}
                <footer className="p-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-xs mt-auto">
                    <div className="flex items-center justify-center gap-4 italic font-bold">
                        <span>© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</span>
                    </div>
                </footer>
            </main>
        </div >
    );
}
