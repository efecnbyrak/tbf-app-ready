"use client";

import { saveAvailability } from "@/app/actions/availability";
import { Info, Lock, Save, AlertTriangle } from "lucide-react";
import { DayRow } from "./DayRow";
import { useActionState, useState } from "react";
import { formatClassification } from "@/lib/format-utils";
import { Referee, Region, AvailabilityForm as AvailabilityFormType, AvailabilityDay } from "@prisma/client";

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

const initialState: { error: string | undefined; success: boolean } = {
    error: undefined,
    success: false
};

export function OfficialAvailabilityForm({ referee, days, existingForm, isLocked, deadline, startDate, endDate, customRoleLabel, customRoleTitle }: OfficialAvailabilityFormProps) {
    const [state, formAction, isPending] = useActionState(saveAvailability, initialState);
    const [clientError, setClientError] = useState<string>("");

    const isRegionSelected = (region: string) => {
        return referee.regions?.some((r: any) => r.name === region);
    };

    const getDayData = (day: Date) => {
        if (!existingForm?.days) return null;
        // Compare dates safely
        return existingForm.days.find((d: any) => {
            const dDate = new Date(d.date);
            return dDate.getDate() === day.getDate() &&
                dDate.getMonth() === day.getMonth() &&
                dDate.getFullYear() === day.getFullYear();
        });
    };

    const handleSubmit = (formData: FormData) => {
        setClientError("");

        // 1. Validate Regions
        const regions = formData.getAll("regions");
        if (regions.length === 0) {
            setClientError("Lütfen en az bir görev bölgesi seçiniz.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // 2. Validate Availability
        // We need to check if at least one day has a status other than "Uygun Değil" (or empty)
        let hasAvailability = false;
        const entries = Array.from(formData.entries());
        for (const [key, value] of entries) {
            if (key.startsWith("day_") && key.endsWith("_slot")) {
                if (value !== "Uygun Değil" && value !== "") {
                    hasAvailability = true;
                    break;
                }
            }
        }

        if (!hasAvailability) {
            setClientError("En az bir gün için uygunluk (UYGUNUM veya saat) belirtmelisiniz.");
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        // Proceed
        formAction(formData);
    };

    return (
        <form action={handleSubmit} className="space-y-8 relative overflow-hidden rounded-3xl">
            {isLocked && (
                <>
                    <div className="absolute inset-0 z-[30] bg-zinc-950/20 backdrop-blur-[2px] pointer-events-none" />
                    <div className="absolute inset-0 z-[35] flex flex-col items-center justify-center pointer-events-none p-4">
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-8 py-6 rounded-3xl shadow-2xl border-4 border-red-600/50 flex flex-col items-center gap-4 transform -rotate-3 scale-110 md:scale-125">
                            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/40">
                                <Lock className="w-10 h-10 text-white" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-1 uppercase tracking-tighter">ERİŞİM KAPALI</h3>
                                <p className="text-zinc-600 dark:text-zinc-400 font-bold text-sm tracking-tight px-4">
                                    PAZAR 15:00 - SALI 20:30
                                </p>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {(state?.error || clientError) && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>{state?.error || clientError}</span>
                </div>
            )}

            {state?.success && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                    Başarıyla kaydedildi.
                </div>
            )}

            <div
                style={isLocked ? { filter: 'grayscale(1)', pointerEvents: 'none', userSelect: 'none' } : {}}
                className="transition-all duration-700 ease-in-out"
            >
                {/* Profile Info Section (Read-Only + Phone) */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold mb-4 border-b dark:border-zinc-800 pb-2">Kişisel Bilgiler</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm text-zinc-500 mb-1">Ad Soyad</label>
                            <input type="text" value={`${referee.firstName} ${referee.lastName}`} disabled className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-3 py-2 text-zinc-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 mb-1">E-Posta</label>
                            <input type="text" value={referee.email} disabled className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-3 py-2 text-zinc-500 cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-500 mb-1">{customRoleTitle || "Klasman"}</label>
                            <input
                                type="text"
                                value={customRoleLabel || formatClassification(referee.classification)}
                                disabled
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded px-3 py-2 text-zinc-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-zinc-900 dark:text-zinc-300 mb-1">Telefon</label>
                            <input
                                type="text"
                                name="phone"
                                defaultValue={referee.phone}
                                disabled={isLocked}
                                placeholder="05XX XXX XX XX"
                                className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 rounded px-3 py-2 focus:ring-2 focus:ring-red-600 disabled:opacity-50"
                            />
                        </div>
                    </div>
                </div>

                {/* Region Section */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
                    <h2 className="text-lg font-semibold mb-2 border-b dark:border-zinc-800 pb-2 flex items-center gap-2">
                        Görev Bölgesi Seçimi
                        {referee.regions?.[0] && (
                            <span className="text-sm font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-700">
                                {referee.regions[0].name}
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-zinc-500 mb-4 italic">
                        * {referee.regions?.[0]?.name || "Şehriniz"} içerisindeki görev alabileceğiniz bölgeleri seçiniz.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        {["Avrupa", "Asya", "BGM"].map(region => (
                            <label key={region} className="flex items-center gap-2 cursor-pointer border p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <input
                                    type="checkbox"
                                    name="regions"
                                    value={region}
                                    defaultChecked={isRegionSelected(region)}
                                    disabled={isLocked}
                                    className="w-5 h-5 text-red-600 rounded focus:ring-red-600"
                                />
                                <span>{region}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">* Görev alabileceğiniz tüm bölgeleri seçiniz.</p>
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
                                    dayName={day.toLocaleDateString('tr-TR', { weekday: 'long' })}
                                    dateString={day.toLocaleDateString('tr-TR')}
                                    initialSlot={dayData ? (dayData.slots as unknown as string) : null}
                                    isLocked={isLocked}
                                    officialType={referee.officialType || (customRoleLabel ? "OFFICIAL" : "REFEREE")}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {!isLocked ? (
                <div className="sticky bottom-4 z-10 flex justify-end mt-8">
                    <button
                        type="submit"
                        disabled={isPending}
                        className="bg-red-700 hover:bg-red-800 text-white font-bold py-3 px-8 rounded-xl shadow-xl flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save />
                        {isPending ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                </div>
            ) : (
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
            )}

        </form>
    );
}
