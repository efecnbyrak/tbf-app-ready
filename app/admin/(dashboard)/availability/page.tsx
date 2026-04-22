import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { Lock, Info } from "lucide-react";
import { formatOfficialType } from "@/lib/format-utils";
import { OfficialAvailabilityForm } from "../../../referee/availability/OfficialAvailabilityForm";
import { SuspensionOverlay } from "@/components/referee/SuspensionOverlay";

export default async function AdminPersonalAvailabilityPage() {
    const session = await verifySession();

    // If they are admin, they can still access their personal form if they are also an official
    // We only redirect if they DON'T have a profile (this is handled below)

    // Check if they are a referee or an official
    const referee = await db.referee.findUnique({
        where: { userId: session.userId },
        include: { user: true, forms: { include: { days: true } } }
    });

    const official = await db.generalOfficial.findUnique({
        where: { userId: session.userId },
        include: { user: true, forms: { include: { days: true } } }
    });

    if (!referee && !official) {
        return <div>Profil Hatası - Bu özellik sadece hakem veya görevli profili olan yöneticiler içindir.</div>;
    }

    const sourceData: any = referee || official;
    const isOfficial = !!official;

    const { startDate, endDate, deadline, isLocked: windowLocked } = await getAvailabilityWindow();

    // Check suspension
    const userProfile = sourceData.user;
    const isSuspended = !!(userProfile?.suspendedUntil && userProfile.suspendedUntil > new Date());
    const isLocked = windowLocked || isSuspended;

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }

    const existingForm = await db.availabilityForm.findFirst({
        where: {
            OR: [
                { refereeId: referee?.id },
                { officialId: official?.id }
            ],
            weekStartDate: startDate
        },
        include: { days: true }
    });

    return (
        <div className="max-w-4xl mx-auto pb-12 relative">
            {isSuspended && <SuspensionOverlay suspendedUntil={userProfile?.suspendedUntil!} dashboardPath="/admin" />}
            <header className="mb-8">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight uppercase italic underline decoration-red-600 decoration-4">Kişisel Uygunluk Formu</h1>
                <div className="flex items-center gap-2 text-zinc-500 font-medium italic">
                    <Info size={16} className="text-red-600" />
                    <span>
                        Dönem: <b>{startDate.toLocaleDateString('tr-TR')} - {endDate.toLocaleDateString('tr-TR')}</b>
                    </span>
                </div>
                {isSuspended ? (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 border-l-4 border-red-600 rounded-lg text-red-700 dark:text-red-400 font-bold italic">
                        Hesabınız {userProfile?.suspendedUntil!.toLocaleDateString('tr-TR')} tarihine kadar dondurulmuştur.
                    </div>
                ) : !isLocked ? (
                    <div className="mt-2 text-sm text-emerald-600 font-black flex items-center gap-1 uppercase tracking-widest">
                        <Lock className="w-4 h-4" /> Form Açık. Son Gün: {deadline.toLocaleDateString('tr-TR', { weekday: 'long' })}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-red-600 font-black flex items-center gap-1 uppercase tracking-widest">
                        <Lock className="w-4 h-4" /> Form Kilitlendi. Değişiklik yapılamaz.
                    </div>
                )}
            </header>

            <OfficialAvailabilityForm
                referee={sourceData}
                days={days}
                existingForm={existingForm}
                isLocked={isLocked}
                deadline={deadline}
                startDate={startDate}
                endDate={endDate}
                customRoleTitle={isOfficial ? "Görev" : undefined}
                customRoleLabel={isOfficial ? (official?.officialType ? formatOfficialType(official.officialType) : "Görevli") : undefined}
            />
        </div>
    );
}
