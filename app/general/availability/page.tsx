import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { Lock, Info } from "lucide-react";
import { formatOfficialType } from "@/lib/format-utils";
import { OfficialAvailabilityForm } from "../../referee/availability/OfficialAvailabilityForm";
import { SuspensionOverlay } from "@/components/referee/SuspensionOverlay";

export default async function OfficialAvailabilityPage() {
    const session = await verifySession();
    const official = await db.generalOfficial.findUnique({
        where: { userId: session.userId },
        include: {
            user: true,
            regions: true,
            forms: { include: { days: true } }
        },
    });

    if (!official) return <div>Profil Hatası</div>;

    const { startDate, endDate, deadline, isLocked: windowLocked } = await getAvailabilityWindow();

    // Check if user is suspended
    const isSuspended = !!(official.user.suspendedUntil && official.user.suspendedUntil > new Date());
    const isLocked = windowLocked || isSuspended;

    const existingForm = await db.availabilityForm.findFirst({
        where: {
            officialId: official.id,
            weekStartDate: startDate
        },
        include: { days: true }
    });

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }

    const realOfficialType = official.officialType;
    const roleLabel = realOfficialType ? formatOfficialType(realOfficialType) : "Görevli";

    return (
        <div className="max-w-4xl mx-auto pb-12 relative">
            {isSuspended && <SuspensionOverlay suspendedUntil={official.user.suspendedUntil!} dashboardPath="/general" />}
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Haftalık Uygunluk Formu</h1>
                <div className="flex items-center gap-2 text-zinc-500">
                    <Info size={16} />
                    <span>
                        Dönem: <b>{startDate.toLocaleDateString('tr-TR')} - {endDate.toLocaleDateString('tr-TR')}</b>
                    </span>
                </div>
                {isSuspended ? (
                    <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 font-medium">
                        Hesabınız {official.user.suspendedUntil!.toLocaleDateString('tr-TR')} tarihine kadar dondurulmuştur. Bu süre zarfında uygunluk formu dolduramazsınız.
                    </div>
                ) : !isLocked ? (
                    <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Form Açık. Son Gün: {deadline.toLocaleDateString('tr-TR', { weekday: 'long' })}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Form Kilitlendi. Değişiklik yapılamaz.
                    </div>
                )}
            </header>

            <OfficialAvailabilityForm
                referee={official}
                days={days}
                existingForm={existingForm}
                isLocked={isLocked}
                deadline={deadline}
                startDate={startDate}
                endDate={endDate}
                customRoleTitle="Görev"
                customRoleLabel={roleLabel}
            />
        </div>
    );
}
