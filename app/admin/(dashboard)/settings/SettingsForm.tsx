"use client";

import { updateSystemSettingsBatch, advanceWeek, resetWeekCounter } from "@/app/actions/settings";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, CalendarClock, ChevronRight, RotateCcw } from "lucide-react";

interface SettingsFormProps {
    initialMode: string;
    initialSeason: string;
    initialTargetDate: string;
    initialWeekNumber: string;
    initialIbanRequired: boolean;
    isSuperAdmin: boolean;
}

export function SettingsForm({
    initialMode,
    initialSeason,
    initialTargetDate,
    initialWeekNumber,
    initialIbanRequired,
    isSuperAdmin
}: SettingsFormProps) {
    const [loading, setLoading] = useState(false);
    const [advanceLoading, setAdvanceLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const router = useRouter();

    // 1. Reactive state for real-time preview
    const [targetDateVal, setTargetDateVal] = useState(initialTargetDate ? new Date(initialTargetDate).toISOString().split('T')[0] : "");
    const [weekNumberVal, setWeekNumberVal] = useState(initialWeekNumber);
    const [ibanRequiredVal, setIbanRequiredVal] = useState(initialIbanRequired);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        const settings = [
            { key: "AVAILABILITY_MODE", value: formData.get("mode") as string },
            { key: "CURRENT_SEASON", value: formData.get("season") as string },
            { key: "CURRENT_WEEK_NUMBER", value: weekNumberVal },
            { key: "AVAILABILITY_TARGET_DATE", value: new Date(targetDateVal).toISOString() },
            { key: "IBAN_COLLECTION_ENABLED", value: String(ibanRequiredVal) },
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

    // 2. Window Calculations for Preview
    let openTime = "Hesaplanamadı";
    let closeTime = "Hesaplanamadı";
    let targetDateDisplay = "AYARLANMADI";

    if (targetDateVal) {
        const targetDateParsed = new Date(targetDateVal);
        targetDateDisplay = targetDateParsed.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });

        const saturday = new Date(targetDateParsed);
        if (saturday.getDay() !== 6) {
            const diff = 6 - saturday.getDay();
            saturday.setDate(saturday.getDate() + diff);
        }

        const open = new Date(saturday);
        open.setDate(saturday.getDate() - 6);
        open.setHours(15, 0, 0, 0);

        const close = new Date(saturday);
        close.setDate(saturday.getDate() - 4);
        close.setHours(20, 30, 0, 0);

        openTime = open.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        closeTime = close.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Week Control Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <h2 className="text-xl font-black mb-4 flex items-center gap-2 uppercase italic tracking-tight">
                    <CalendarClock className="w-5 h-5 text-red-600" />
                    Uygunluk Haftası Yönetimi
                </h2>

                <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-800/50 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <CalendarClock className="w-12 h-12 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mb-2 uppercase italic tracking-[0.2em] flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        Aktif Form Dönemi (Cumartesiye Göre)
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-[11px] font-black uppercase italic relative z-10">
                        <div>
                            <p className="text-zinc-500 mb-0.5 leading-none">Açılış:</p>
                            <p className="text-emerald-700 dark:text-emerald-300 text-sm tracking-tight">{openTime}</p>
                        </div>
                        <div>
                            <p className="text-zinc-500 mb-0.5 leading-none">Kapanış:</p>
                            <p className="text-emerald-700 dark:text-emerald-300 text-sm tracking-tight">{closeTime}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6 p-5 bg-red-600 dark:bg-red-700 rounded-3xl shadow-xl shadow-red-600/10 relative overflow-hidden group">
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em] italic mb-1">Mevcut Operasyonel Hafta</p>
                            <p className="text-3xl font-black text-white italic tracking-tighter leading-none">{weekNumberVal}. HAFTA</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={resetLoading}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/20 text-white rounded-xl p-3 transition-all active:scale-95 disabled:opacity-50"
                            title="Sıfırla"
                        >
                            {resetLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border-2 border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest italic mb-1">Hedef Maç Tarihleri</p>
                        <p className="text-zinc-900 dark:text-white font-black text-lg italic tracking-tight uppercase">
                            {targetDateDisplay}
                        </p>
                        <p className="text-[10px] text-zinc-400 font-bold mt-1 uppercase italic tracking-widest leading-none">Sistem otomatik yönetilir.</p>
                    </div>
                    <button
                        type="button"
                        onClick={handleAdvance}
                        disabled={advanceLoading}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 rounded-xl font-black text-[10px] tracking-widest uppercase italic hover:bg-red-700 hover:text-white transition-all disabled:opacity-50 shadow-lg active:scale-95"
                    >
                        {advanceLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                        SİSTEMİ İLERLET
                    </button>
                </div>
            </div>

            <form onSubmit={handleSave} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                <h2 className="text-lg font-black mb-6 uppercase italic tracking-tight text-zinc-900 dark:text-white border-b dark:border-zinc-800 pb-2">Genel Yapılandırma</h2>
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl gap-4 border border-zinc-100 dark:border-zinc-800">
                        <div>
                            <p className="font-black text-zinc-900 dark:text-white text-sm uppercase italic">Uygunluk Formu Dönemi</p>
                            <p className="text-xs text-zinc-500 font-bold uppercase italic">Formların açık veya kapalı olma durumu</p>
                        </div>
                        <select name="mode" defaultValue={initialMode} className="w-full md:w-auto bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-xs font-bold uppercase italic focus:ring-2 focus:ring-red-600 outline-none">
                            <option value="AUTO">Açık (Otomatik - Süreli)</option>
                            <option value="CLOSED">Manuel: KİLİTLİ (Form Kapanır)</option>
                            <option value="OPEN">Manuel: AÇIK (Süre dolsa da açık)</option>
                        </select>
                    </div>

                    {isSuperAdmin && (
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl gap-4 border border-zinc-100 dark:border-zinc-800">
                            <div>
                                <p className="font-black text-zinc-900 dark:text-white text-sm uppercase italic">IBAN Bilgisi Zorunlu Olsun mu?</p>
                                <p className="text-xs text-zinc-500 font-bold uppercase italic">Aktif edilirse, IBAN'ı eksik olan kullanıcılar sisteme girişte IBAN girmeye zorlanır.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase italic ${!ibanRequiredVal ? 'text-zinc-400' : 'text-zinc-300'}`}>PASİF</span>
                                <button
                                    type="button"
                                    onClick={() => setIbanRequiredVal(!ibanRequiredVal)}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${ibanRequiredVal ? 'bg-red-600' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${ibanRequiredVal ? 'translate-x-7' : 'translate-x-0'}`} />
                                </button>
                                <span className={`text-[10px] font-black uppercase italic ${ibanRequiredVal ? 'text-red-600' : 'text-zinc-400'}`}>AKTİF</span>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="font-black text-zinc-900 dark:text-white text-sm uppercase italic mb-2">Mevcut Hafta No</p>
                            <input
                                name="weekNumber"
                                type="number"
                                value={weekNumberVal}
                                onChange={(e) => setWeekNumberVal(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm font-black italic focus:ring-2 focus:ring-red-600 outline-none"
                            />
                        </div>
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <p className="font-black text-zinc-900 dark:text-white text-sm uppercase italic mb-2">Hedef Maç Tarihi (Cumartesi)</p>
                            <input
                                name="targetDate"
                                type="date"
                                value={targetDateVal}
                                onChange={(e) => setTargetDateVal(e.target.value)}
                                className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm font-black italic focus:ring-2 focus:ring-red-600 outline-none"
                            />
                        </div>
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 md:col-span-2">
                            <p className="font-black text-zinc-900 dark:text-white text-sm uppercase italic mb-2">Aktif Sezon</p>
                            <input
                                name="season"
                                defaultValue={initialSeason}
                                className="w-full bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-xl px-4 py-3 text-sm font-black italic focus:ring-2 focus:ring-red-600 outline-none"
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button disabled={loading} className="w-full md:w-auto bg-red-700 text-white px-10 py-4 rounded-2xl text-xs font-black tracking-widest uppercase italic hover:bg-black flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-red-700/20">
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        AYARLARI KAYDET
                    </button>
                </div>
            </form>
        </div>
    );
}
