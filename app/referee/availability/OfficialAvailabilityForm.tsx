"use client";

import { saveAvailability } from "@/app/actions/availability";
import { Lock, Save, AlertTriangle, CheckCircle2, CalendarCheck } from "lucide-react";
import { DayRow } from "./DayRow";
import { useActionState, useState, useEffect } from "react";
import { formatClassification, formatOfficialType } from "@/lib/format-utils";

interface OfficialAvailabilityFormProps {
    referee: any;
    days: Date[];
    existingForm: any;
    isLocked: boolean;
    deadline: Date;
    startDate: Date;
    endDate: Date;
    customRoleLabel?: string;
    customRoleTitle?: string;
}

interface SavedDay {
    date: Date;
    slots: string;
}

const initialState: { error: string | undefined; success: boolean } = {
    error: undefined,
    success: false
};

export function OfficialAvailabilityForm({ referee, days, existingForm, isLocked, deadline, startDate, endDate, customRoleLabel, customRoleTitle }: OfficialAvailabilityFormProps) {
    const [state, formAction, isPending] = useActionState(saveAvailability, initialState);
    const [clientError, setClientError] = useState<string>("");
    const [isSubmittedLocked, setIsSubmittedLocked] = useState(!!existingForm);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [savedDays, setSavedDays] = useState<SavedDay[] | null>(
        existingForm?.days
            ? existingForm.days
                .filter((d: any) => d.slots !== "Uygun Değil")
                .map((d: any) => ({ date: new Date(d.date), slots: d.slots }))
                .sort((a: SavedDay, b: SavedDay) => a.date.getTime() - b.date.getTime())
            : null
    );

    useEffect(() => {
        if (state?.success) {
            setShowSuccessPopup(true);
            setIsSubmittedLocked(true);
        }
    }, [state?.success]);

    const isRegionSelected = (region: string) => {
        return referee.regions?.some((r: any) => r.name === region);
    };

    const getDayData = (day: Date) => {
        if (!existingForm?.days) return null;
        return existingForm.days.find((d: any) => {
            const dDate = new Date(d.date);
            return dDate.getDate() === day.getDate() &&
                dDate.getMonth() === day.getMonth() &&
                dDate.getFullYear() === day.getFullYear();
        });
    };

    const handleSubmit = (formData: FormData) => {
        setClientError("");

        // Kaydedilecek günleri yakala (özet için)
        const captured: SavedDay[] = [];
        for (let i = 0; i < 7; i++) {
            const slot = formData.get(`day_${i}_slot`) as string;
            if (slot && slot !== "Uygun Değil") {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                captured.push({ date: d, slots: slot });
            }
        }
        setSavedDays(captured);

        formAction(formData);
    };

    const effectiveIsLocked = isLocked || isSubmittedLocked;

    return (
        <form action={handleSubmit} className="space-y-8 relative overflow-hidden rounded-3xl">
            {/* Kaydet Başarı Popup */}
            {showSuccessPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border-4 border-green-500 p-8 flex flex-col items-center gap-4 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                            <CheckCircle2 className="w-9 h-9 text-white" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter mb-1">KAYDEDİLDİ!</h3>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Uygunluk formunuz başarıyla kaydedildi.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowSuccessPopup(false)}
                            className="bg-green-500 hover:bg-green-600 text-white font-black py-2 px-8 rounded-xl transition-all transform hover:scale-105 active:scale-95 uppercase text-sm tracking-wider"
                        >
                            Tamam
                        </button>
                    </div>
                </div>
            )}

            {/* Kaydet Sonrası Özet (en üstte) */}
            {isSubmittedLocked && !isLocked && savedDays && savedDays.length > 0 && (
                <div className="mb-2 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-3xl p-6 shadow-sm animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="flex items-start gap-3 mb-5">
                        <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-green-600/20">
                            <CalendarCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-green-800 dark:text-green-200 uppercase tracking-tight">
                                Bu Haftaki Uygunluğunuz
                            </h2>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                                {new Date(startDate).toLocaleDateString("tr-TR")} – {new Date(endDate).toLocaleDateString("tr-TR")}
                                <span className="ml-2 text-xs font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                                    {savedDays.length} gün uygun
                                </span>
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase">Gönderildi</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {savedDays.map((day, idx) => (
                            <div
                                key={idx}
                                className="p-3 rounded-2xl border bg-white dark:bg-zinc-900 border-green-200 dark:border-green-800 shadow-sm"
                            >
                                <div className="text-xs font-black uppercase mb-1 text-green-600 dark:text-green-400">
                                    {day.date.toLocaleDateString("tr-TR", { weekday: "short" })}
                                </div>
                                <div className="text-sm font-semibold mb-1 text-zinc-800 dark:text-zinc-200">
                                    {day.date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                                </div>
                                <div className="text-xs font-bold leading-tight text-zinc-600 dark:text-zinc-400">
                                    {day.slots}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {effectiveIsLocked && (
                <div className="relative z-[40] mb-8 animate-in slide-in-from-top-4 duration-500">
                    {isSubmittedLocked && !isLocked ? (
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-4 sm:px-8 py-8 sm:py-10 rounded-[2.5rem] shadow-2xl border-4 border-red-600/50 flex flex-col items-center gap-4 group hover:scale-[1.02] transition-transform">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/40 rotate-3 group-hover:rotate-0 transition-transform">
                                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            </div>
                            <div className="text-center mb-2">
                                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-tighter italic">BAŞARIYLA KAYDEDİLDİ</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 font-bold text-xs sm:text-sm tracking-tight px-2 sm:px-4 uppercase opacity-80">
                                    Uygunluk formunuz güncellendi.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSubmittedLocked(false)}
                                className="bg-red-600 hover:bg-red-700 text-white font-black py-3 px-6 sm:px-8 rounded-xl shadow-xl hover:shadow-red-600/20 transition-all transform hover:scale-105 active:scale-95 uppercase text-xs sm:text-sm tracking-wider w-full sm:w-auto text-center"
                            >
                                Güncellemek İçin Tıkla
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl px-4 sm:px-8 py-8 sm:py-10 rounded-[2.5rem] shadow-2xl border-4 border-red-600/50 flex flex-col items-center gap-4 group hover:scale-[1.02] transition-transform">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/40 rotate-3 group-hover:rotate-0 transition-transform">
                                <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-tighter italic">ERİŞİM KAPALI</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 font-bold text-xs sm:text-sm tracking-tight px-2 sm:px-4 uppercase opacity-80">
                                    PAZAR 15:00 - SALI 20:30
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {(state?.error || clientError) && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded-2xl relative flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase italic tracking-tight">{state?.error || clientError}</span>
                </div>
            )}

            <div
                style={effectiveIsLocked ? { filter: "blur(8px) grayscale(1)", pointerEvents: "none", userSelect: "none" } : {}}
                className="transition-all duration-700 ease-in-out"
            >
                {/* Profile Info Section */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold mb-4 border-b dark:border-zinc-800 pb-2">Kişisel Bilgiler</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-400 mb-1">Ad Soyad</label>
                            <input type="text" value={`${referee.firstName} ${referee.lastName}`} disabled className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-3 py-2 text-zinc-700 dark:text-zinc-300 cursor-not-allowed font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-400 mb-1">E-Posta</label>
                            <input type="text" value={referee.email} disabled className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-3 py-2 text-zinc-700 dark:text-zinc-300 cursor-not-allowed font-medium" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-400 mb-1">{customRoleTitle || (referee.officialType ? "Görev" : "Klasman")}</label>
                            <input
                                type="text"
                                value={customRoleLabel || (referee.officialType ? formatOfficialType(referee.officialType) : formatClassification(referee.classification))}
                                disabled
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-3 py-2 text-zinc-700 dark:text-zinc-300 cursor-not-allowed font-medium"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-300">Telefon</label>
                                <span className="text-[9px] text-red-600 font-bold uppercase italic">Profilimden Değiştirilir</span>
                            </div>
                            <input
                                type="text"
                                name="phone"
                                defaultValue={referee.phone}
                                readOnly
                                title="Telefon numaranızı profil sayfanızdan güncelleyebilirsiniz."
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border-2 border-transparent rounded px-3 py-2 text-zinc-500 dark:text-zinc-400 font-bold cursor-not-allowed"
                            />
                        </div>
                    </div>
                </div>

                {/* Region Section */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold mb-2 border-b dark:border-zinc-800 pb-2 flex items-center gap-2">
                        Görev Bölgesi Seçimi
                        {referee.regions?.[0] && (
                            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                                {referee.regions[0].name}
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-zinc-700 dark:text-zinc-400 mb-4 italic font-medium">
                        * {referee.regions?.[0]?.name || "Şehriniz"} içerisindeki görev alabileceğiniz bölgeleri seçiniz.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        {["Avrupa", "Anadolu", "BGM"].map(region => (
                            <label key={region} className="flex items-center gap-2 cursor-pointer border-2 border-zinc-100 dark:border-zinc-800 p-3 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors group">
                                <input
                                    type="checkbox"
                                    name="regions"
                                    value={region}
                                    defaultChecked={isRegionSelected(region)}
                                    disabled={effectiveIsLocked}
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-600 border-zinc-300 dark:border-zinc-700"
                                />
                                <span className="font-black text-zinc-900 dark:text-zinc-200 group-hover:text-red-600 transition-colors uppercase italic text-sm">{region}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-zinc-700 dark:text-zinc-400 mt-2 font-medium italic">* Görev alabileceğiniz tüm bölgeleri seçiniz.</p>
                </div>

                {/* Days Grid */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 border-b dark:border-zinc-800 pb-2">Haftalık Program</h2>
                    <div className="space-y-4">
                        {days.map((day, index) => {
                            const dayData = getDayData(day);
                            return (
                                <DayRow
                                    key={index}
                                    index={index}
                                    dayName={day.toLocaleDateString("tr-TR", { weekday: "long" })}
                                    dateString={day.toLocaleDateString("tr-TR")}
                                    initialSlot={dayData ? (dayData.slots as unknown as string) : null}
                                    isLocked={effectiveIsLocked}
                                    officialType={referee.officialType || "REFEREE"}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {!effectiveIsLocked ? (
                <div className="sticky bottom-4 z-10 flex justify-end mt-8">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-xl shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save />
                        {isPending ? "Kaydediliyor..." : "Kaydet"}
                    </button>
                </div>
            ) : isLocked ? (
                <div className="p-6 bg-zinc-100 dark:bg-zinc-800/50 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-500 rounded-3xl flex flex-col md:flex-row items-center gap-4 text-center md:text-left mt-8">
                    <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl flex items-center justify-center shrink-0">
                        <Lock className="w-6 h-6 text-zinc-400" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg text-zinc-700 dark:text-zinc-300">Form Şu An Erişime Kapalı</h3>
                        <p className="text-sm font-medium opacity-80">
                            Sistem otomatik olarak Pazar 15:00'da açılır ve Salı 20:30'da kilitlenir.
                        </p>
                    </div>
                </div>
            ) : null}
        </form>
    );
}