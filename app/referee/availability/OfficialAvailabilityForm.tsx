"use client";

import { saveAvailability } from "@/app/actions/availability";
import { Info, Lock, Save, AlertTriangle } from "lucide-react";
import { DayRow } from "./DayRow";
import { useActionState } from "react";
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

    // Helper to get day data
    const getDayData = (date: Date) => {
        if (!existingForm) return null;
        const target = date.toISOString().split('T')[0];
        return (existingForm.days as AvailabilityDay[]).find((d: AvailabilityDay) => {
            const dayDate = d.date instanceof Date ? d.date.toISOString().split('T')[0] : (d.date as unknown as string).split('T')[0];
            return dayDate === target;
        });
    };

    const isRegionSelected = (rName: string) => referee.regions.some((r: Region) => r.name === rName);

    return (
        <form action={formAction} className="space-y-8">
            {state?.error && (
                <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                    {state.error}
                </div>
            )}

            {state?.success && (
                <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded relative">
                    Başarıyla kaydedildi.
                </div>
            )}

            {/* Profile Info Section (Read-Only + Phone) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
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
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <h2 className="text-lg font-semibold mb-4 border-b dark:border-zinc-800 pb-2">Görev Bölgesi Seçimi</h2>
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

            {!isLocked ? (
                <div className="sticky bottom-4 z-10 flex justify-end">
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
                <div className="p-4 bg-orange-100 border border-orange-200 text-orange-800 rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Bu formun süresi dolduğu için değişiklik yapamazsınız.</span>
                </div>
            )}

        </form>
    );
}
