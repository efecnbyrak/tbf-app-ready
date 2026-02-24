"use client";

import { updateSystemSettingsBatch, advanceWeek, resetWeekCounter } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, CalendarClock, ChevronRight, RotateCcw, Save } from "lucide-react";

interface SettingsFormProps {
    initialMode: string;
    initialSeason: string;
    initialTargetDate: string;
    initialWeekNumber: string;
}

export function SettingsForm({ initialMode, initialSeason, initialTargetDate, initialWeekNumber }: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [advanceLoading, setAdvanceLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const router = useRouter();

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const settings = [
            { key: "AVAILABILITY_MODE", value: formData.get("mode") as string },
            { key: "CURRENT_SEASON", value: formData.get("season") as string },
            { key: "CURRENT_WEEK_NUMBER", value: formData.get("weekNumber") as string },
            { key: "AVAILABILITY_TARGET_DATE", value: formData.get("targetDate") as string },
        ];

        const result = await updateSystemSettingsBatch(settings);

        setLoading(false);

        if (result.success) {
            router.refresh();
            alert("Ayarlar başarıyla güncellendi!");
        } else {
            alert(result.error || "Bir hata oluştu.");
        }
    };

    const handleAdvance = async () => {
        if (!confirm("Haftayı ilerletmek istediğinize emin misiniz? Bu işlem hedef tarihi 7 gün ileri atar ve hafta sayacını +1 arttırır.")) return;
        setAdvanceLoading(true);
        const res = await advanceWeek();
        setAdvanceLoading(false);
        if (res.error) alert(res.error);
        else {
            alert("Hafta ilerletildi!");
            window.location.reload();
        }
    };

    const handleReset = async () => {
        if (!confirm("Hafta sayacını sıfırlamak istediğinize emin misiniz? Bu işlem hafta numarasını 1'e çeker.")) return;
        setResetLoading(true);
        const res = await resetWeekCounter();
        setResetLoading(false);
        if (res.error) alert(res.error);
        else {
            alert("Hafta sayacı sıfırlandı!");
            window.location.reload();
        }
    };

    const targetDateParsed = initialTargetDate ? new Date(initialTargetDate) : null;

    // Window calculation for display
    let openTime = "Hesaplanamadı";
    let closeTime = "Hesaplanamadı";

    if (targetDateParsed) {
        const open = new Date(targetDateParsed);
        open.setDate(targetDateParsed.getDate() - 6);
        open.setHours(15, 30, 0, 0);

        const close = new Date(targetDateParsed);
        close.setDate(targetDateParsed.getDate() - 4);
        close.setHours(18, 30, 0, 0);

        openTime = open.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        closeTime = close.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Week Control Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <CalendarClock className="w-5 h-5 text-red-600" />
                    Uygunluk Haftası Yönetimi
                </h2>

                {/* Window info */}
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">⏱️ Mevcut Form Zamanlaması</p>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <p className="text-zinc-500">Açılış:</p>
                            <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{openTime}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500">Kapanış:</p>
                            <p className="font-mono font-bold text-zinc-900 dark:text-zinc-100">{closeTime}</p>
                        </div>
                    </div>
                </div>

                {/* Week Number Display */}
                <div className="mb-4 p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-400">Mevcut Dönem</p>
                            <p className="text-3xl font-bold text-red-900 dark:text-red-300">{initialWeekNumber}. Hafta</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                disabled={resetLoading}
                                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 border-2 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/30 transition-all disabled:opacity-50"
                            >
                                {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                Sıfırla
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <p className="font-bold text-zinc-900 dark:text-white">Hedef Hafta (Maç Tarihleri)</p>
                        <p className="text-zinc-500 font-medium">
                            {targetDateParsed ? targetDateParsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : "Ayarlanmadı"} haftası
                        </p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <p className="font-medium mb-1">Mevcut Hafta No</p>
                            <input
                                name="weekNumber"
                                type="number"
                                defaultValue={initialWeekNumber}
                                className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded px-3 py-2 text-sm font-bold"
                            />
                        </div>
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                            <p className="font-medium mb-1">Hedef Tarih (Cumartesi)</p>
                            <input
                                name="targetDate"
                                type="date"
                                defaultValue={initialTargetDate ? initialTargetDate.split('T')[0] : ""}
                                className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded px-3 py-2 text-sm font-bold"
                            />
                        </div>
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
