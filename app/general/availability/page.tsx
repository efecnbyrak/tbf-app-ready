import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { Info, Lock } from "lucide-react";
import { AvailabilityForm } from "@/app/referee/availability/AvailabilityForm";

export default async function OfficialAvailabilityPage() {
    const session = await verifySession();
    const referee = await db.referee.findUnique({
        where: { userId: session.userId },
        include: { regions: true, forms: { include: { days: true } } },
    });

    if (!referee) return <div>Profil Hatası</div>;

    const { startDate, endDate, deadline, isLocked } = await getAvailabilityWindow();

    const existingForm = await db.availabilityForm.findUnique({
        where: {
            refereeId_weekStartDate: {
                refereeId: referee.id,
                weekStartDate: startDate
            }
        },
        include: { days: true }
    });

    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        days.push(d);
    }

    // Workaround: Fetch officialType via raw Query
    const rawType = await db.$queryRaw<Array<{ officialType: string }>>`
        SELECT "officialType" FROM referees WHERE id = ${referee.id}
    `;
    const realOfficialType = rawType[0]?.officialType || referee.officialType;

    const typeLabels: Record<string, string> = {
        "TABLE": "Masa Görevlisi",
        "OBSERVER": "Gözlemci",
        "HEALTH": "Sağlıkçı",
        "STATISTICIAN": "İstatistikçi",
        "REFEREE": "Hakem"
    };

    const roleLabel = typeLabels[realOfficialType!] || realOfficialType || "Görevli";

    return (
        <div className="max-w-4xl mx-auto pb-12">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Haftalık Uygunluk Formu</h1>
                <div className="flex items-center gap-2 text-zinc-500">
                    <Info size={16} />
                    <span>
                        Dönem: <b>{startDate.toLocaleDateString('tr-TR')} - {endDate.toLocaleDateString('tr-TR')}</b>
                    </span>
                </div>
                {!isLocked ? (
                    <div className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Form Açık. Son Gün: {deadline.toLocaleDateString('tr-TR', { weekday: 'long' })}
                    </div>
                ) : (
                    <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1">
                        <Lock className="w-4 h-4" /> Form Kilitlendi. Değişiklik yapılamaz.
                    </div>
                )}
            </header>

            <AvailabilityForm
                referee={referee}
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
