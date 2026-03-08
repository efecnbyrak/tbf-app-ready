import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { Info, Lock } from "lucide-react";
import { OfficialAvailabilityForm } from "./OfficialAvailabilityForm";
import { SuspensionOverlay } from "@/components/referee/SuspensionOverlay";

export default async function AvailabilityPage() {
    const session = await verifySession();
    let sourceData: any = await db.referee.findUnique({
        where: { userId: session.userId },
        include: {
            user: true,
            regions: true,
            forms: { include: { days: true } }
        },
    });

    let isOfficial = false;

    if (!sourceData) {
        sourceData = await db.generalOfficial.findUnique({
            where: { userId: session.userId },
            include: {
                user: true,
                regions: true,
            }
        });
        isOfficial = true;
    }

    if (!sourceData) return <div>Profil Hatası</div>;

    const { startDate, endDate, deadline, isLocked: windowLocked } = await getAvailabilityWindow();

    // Check if user is suspended or has active penalties
    const activePenalty = await db.penalty.findFirst({
        where: {
            userId: session.userId,
            isActive: true,
            OR: [
                { endDate: null },
                { endDate: { gt: new Date() } }
            ]
        },
        orderBy: { startDate: 'desc' }
    });

    const isSuspended = !!(sourceData.user.suspendedUntil && sourceData.user.suspendedUntil > new Date()) || !!activePenalty;
    const suspensionReason = activePenalty?.reason || "Hesabınız dondurulmuştur.";
    const suspensionEndDate = activePenalty?.endDate || sourceData.user.suspendedUntil;

    const isLocked = windowLocked || isSuspended;

    const existingForm = await db.availabilityForm.findFirst({
        where: {
            ...(isOfficial ? { officialId: sourceData.id } : { refereeId: sourceData.id }),
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

    return (
        <div className="max-w-4xl mx-auto pb-12 relative">
            {isSuspended && <SuspensionOverlay suspendedUntil={sourceData.user.suspendedUntil!} dashboardPath="/referee" />}
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
                        {suspensionEndDate
                            ? `${suspensionEndDate.toLocaleDateString('tr-TR')} tarihine kadar cezalı/askıda olduğunuz için uygunluk formu dolduramazsınız.`
                            : "Süresiz cezalı/askıda olduğunuz için uygunluk formu dolduramazsınız."
                        }
                        <div className="mt-2 text-sm opacity-80 italic">Sebep: {suspensionReason}</div>
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
                referee={sourceData}
                days={days}
                existingForm={existingForm}
                isLocked={isLocked}
                deadline={deadline}
                startDate={startDate}
                endDate={endDate}
            />
        </div>
    );
}
