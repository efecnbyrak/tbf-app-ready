"use client";

import { updateSystemSetting, advanceWeek } from "@/app/actions/settings";
import { useState } from "react";
import { Loader2, CalendarClock, ChevronRight } from "lucide-react";

interface SettingsFormProps {
    initialMode: string;
    initialSeason: string;
    initialTargetDate: string;
}

export function SettingsForm({ initialMode, initialSeason, initialTargetDate }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [advanceLoading, setAdvanceLoading] = useState(false);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        await updateSystemSetting("AVAILABILITY_MODE", formData.get("mode") as string);
        await updateSystemSetting("CURRENT_SEASON", formData.get("season") as string);

        setLoading(false);
        alert("Ayarlar kaydedildi!");
    };

    const handleAdvance = async () => {
        if (!confirm("Haftayı ilerletmek istediğinize emin misiniz? Bu işlem hedef tarihi 7 gün ileri atar.")) return;
        setAdvanceLoading(true);
        const res = await advanceWeek();
        setAdvanceLoading(false);
        if (res.error) alert(res.error);
        else alert("Hafta ilerletildi!");
    };

    const targetDateDisplay = initialTargetDate
        ? new Date(initialTargetDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
        : "Otomatik (Gelecek Hafta)";

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Week Control Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-red-600" />
                    Uygunluk Haftası Yönetimi
                </h2>
                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Hedef Hafta (Maç Tarihleri)</p>
                        <p className="text-zinc-500 font-medium">{targetDateDisplay} haftası</p>
                        <p className="text-xs text-zinc-400 mt-1">Bu haftanın atamaları için form toplanır.</p>
                    </div>
                    <button
                        onClick={handleAdvance}
                        disabled={advanceLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white dark:bg-zinc-700 rounded-lg font-bold hover:bg-zinc-800 dark:hover:bg-zinc-600 transition-all disabled:opacity-50"
                    >
                        {advanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        Haftayı İlerle
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h2 className="text-xl font-semibold mb-4">Genel Yapılandırma</h2>
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg gap-4">
                        <div>
                            <p className="font-medium">Uygunluk Formu Dönemi</p>
                            <p className="text-sm text-zinc-500">Formların açık veya kapalı olma durumu</p>
                        </div>
                        <select name="mode" defaultValue={initialMode} className="w-full md:w-auto bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded px-3 py-2 md:py-1 text-sm">
                            <option value="AUTO">Açık (Otomatik - Süreli)</option>
                            <option value="CLOSED">Manuel: KİLİTLİ (Form Kapanır)</option>
                            <option value="OPEN">Manuel: AÇIK (Süre dolsa da açık)</option>
                        </select>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg gap-4">
                        <div>
                            <p className="font-medium">Sezon</p>
                            <p className="text-sm text-zinc-500">Aktif TBF sezonu</p>
                        </div>
                        <input
                            name="season"
                            defaultValue={initialSeason}
                            className="w-full md:w-32 bg-zinc-100 dark:bg-zinc-700 border-none rounded px-3 py-2 md:py-1 md:text-right font-bold"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button disabled={loading} className="w-full md:w-auto bg-red-700 text-white px-6 py-3 md:py-2 rounded-lg text-sm font-medium hover:bg-red-800 flex items-center justify-center gap-2 transition-transform active:scale-95">
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        Kaydet
                    </button>
                </div>
            </form>
        </div>
    );
}
