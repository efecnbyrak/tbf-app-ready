import { ResponsiveNav } from "@/app/referee/ResponsiveNav";

import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings-cache";

import { IBANRequirementModal } from "@/components/IBANRequirementModal";
import { MandatoryAnnouncementModal } from "@/components/announcements/MandatoryAnnouncementModal";
import { UpcomingMatchPopup } from "@/components/matches/UpcomingMatchPopup";

export default async function OfficialLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    // SUPER_ADMIN'in /general paneline ihtiyacı yok; doğrudan yönetim hub'una gönder.
    if (session.role === "SUPER_ADMIN") {
        redirect("/admin");
    }

    const [user, ibanValue] = await Promise.all([
        db.user.findUnique({
            where: { id: session.userId },
            select: {
                referee: { select: { firstName: true, lastName: true, imageUrl: true, iban: true } },
                official: { select: { firstName: true, lastName: true, imageUrl: true, officialType: true, iban: true } },
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

    const realOfficialType = user?.official?.officialType || "TABLE";
    const realFirstName = user?.official?.firstName || "Kullanıcı";

    const isAdmin = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK", "OBSERVER"].includes(session.role);

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            <ResponsiveNav
                refereeName={realFirstName}
                roleType={realOfficialType}
                basePath="/general"
                isAdminObserver={isAdmin}
            />

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
        </div>
    );
}
