import Link from "next/link";
import { ArrowRight, CheckCircle } from "lucide-react";
import { db } from "@/lib/db";

export async function RefereeAvailabilitySection({ userId }: { userId: number }) {
    let sourceData: { id: number; type: 'referee' | 'official' } | null = null;

    const referee = await db.referee.findUnique({
        where: { userId },
        select: { id: true }
    });

    if (referee) {
        sourceData = { id: referee.id, type: 'referee' };
    } else {
        const official = await db.generalOfficial.findUnique({
            where: { userId },
            select: { id: true }
        });
        if (official) {
            sourceData = { id: official.id, type: 'official' };
        }
    }

    if (!sourceData) return null;

    const availabilityForms = await db.availabilityForm.findMany({
        where: sourceData.type === 'referee' ? { refereeId: sourceData.id } : { officialId: sourceData.id },
        include: {
            days: true
        },
        orderBy: {
            weekStartDate: 'desc'
        },
        take: 5
    });

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                Uygunluklarım
            </h2>

            {availabilityForms.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                    <p className="text-zinc-500">Henüz uygunluk formu göndermediniz.</p>
                    <Link
                        href="/referee/availability"
                        className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        İlk Formu Gönder
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {availabilityForms.map((form) => {
                        const formattedDate = new Date(form.weekStartDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });

                        const totalSlots = form.days.reduce((acc, day) => {
                            if (day.slots) {
                                return acc + day.slots.split(',').length;
                            }
                            return acc;
                        }, 0);

                        const isSubmitted = form.status === "SUBMITTED" || form.status === "LOCKED";

                        return (
                            <div
                                key={form.id}
                                className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="font-semibold text-zinc-900 dark:text-white">
                                            {formattedDate} Haftası
                                        </h3>
                                        <p className="text-sm text-zinc-500">
                                            {form.days.length} gün • {totalSlots} zaman dilimi
                                        </p>
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${isSubmitted
                                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                        : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                        }`}>
                                        {isSubmitted ? "Gönderildi" : "Taslak"}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                    <span className="dark:text-zinc-500">
                                        Son güncelleme: {new Date(form.updatedAt).toLocaleDateString('tr-TR')}
                                    </span>
                                    <Link
                                        href="/referee/availability"
                                        className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                    >
                                        Görüntüle
                                        <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
