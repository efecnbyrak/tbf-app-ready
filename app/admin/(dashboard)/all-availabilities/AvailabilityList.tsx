"use client";

import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { formatClassification, formatOfficialType } from "@/lib/format-utils";
import { Referee, Region, AvailabilityForm as PrismaForm, AvailabilityDay, GeneralOfficial } from "@prisma/client";

type AvailabilityFormWithDetails = PrismaForm & {
    referee: (Referee & { regions: Region[] }) | null;
    official: (GeneralOfficial & { regions: Region[] }) | null;
    days: AvailabilityDay[];
};

interface AvailabilityListProps {
    forms: AvailabilityFormWithDetails[];
    startDate: Date;
    endDate: Date;
}

export function AvailabilityList({ forms, startDate, endDate }: AvailabilityListProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const filteredForms = React.useMemo(() => {
        return forms.filter((form) => {
            const profile = form.referee || form.official;
            if (!profile) return false;

            const fullName = `${profile.firstName} ${profile.lastName}`.toLowerCase();
            const search = searchTerm.toLowerCase();
            const matchesName = fullName.includes(search);

            const matchesClass = form.referee
                ? form.referee.classification.toLowerCase().includes(search)
                : (form.official?.officialType?.toLowerCase().includes(search) || false);

            const matchesRegion = profile.regions?.some((r) => r.name.toLowerCase().includes(search)) || false;

            return matchesName || matchesClass || matchesRegion;
        });
    }, [forms, searchTerm]);

    const toggleExpand = (id: number) => {
        if (expandedId === id) setExpandedId(null);
        else setExpandedId(id);
    };

    const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
        if (!highlight.trim()) return <span>{text}</span>;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-200 text-black px-0.5 rounded shadow-sm">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    const DayGrid = ({ form, isMobile }: { form: AvailabilityFormWithDetails, isMobile: boolean }) => (
        <div className={isMobile
            ? "mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2"
            : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 p-2"
        }>
            {Array.from({ length: 7 }).map((_, i) => {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dayStr = d.toISOString().split('T')[0];

                const record = form.days.find((day) => {
                    const recordDate = new Date(day.date);
                    return recordDate.toISOString().split('T')[0] === dayStr;
                });

                const slot = record ? record.slots : "Uygun Değil";
                const isAvailable = slot !== "Uygun Değil";

                if (isMobile) {
                    return (
                        <div key={i} className={`
                            flex justify-between items-center p-3 rounded-lg border text-sm
                            ${isAvailable
                                ? "bg-green-50 border-green-200 text-green-900 dark:bg-zinc-900 dark:border-green-900 dark:text-green-400"
                                : "bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-800"
                            }
                        `}>
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="opacity-70 shrink-0" />
                                <div>
                                    <div className="font-semibold">{d.toLocaleDateString("tr-TR", { weekday: "long" })}</div>
                                    <div className="text-xs opacity-70">{d.toLocaleDateString("tr-TR")}</div>
                                </div>
                            </div>
                            <span className="font-medium text-right ml-2">{slot}</span>
                        </div>
                    );
                }

                return (
                    <div key={i} className={`
                        p-3 rounded-lg border text-sm
                        ${isAvailable
                            ? "bg-white border-green-200 text-green-700 dark:bg-zinc-900 dark:border-green-900 dark:text-green-400"
                            : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-700"
                        }
                    `}>
                        <div className="font-semibold mb-1 flex items-center gap-2">
                            <Calendar size={14} />
                            {d.toLocaleDateString("tr-TR", { weekday: "long" })}
                        </div>
                        <div className="font-mono text-xs opacity-75 mb-2">
                            {d.toLocaleDateString("tr-TR")}
                        </div>
                        <div className="font-bold">
                            {slot}
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div>
            {/* Search Bar */}
            <div className="mb-4 sm:mb-6">
                <div className="relative w-full sm:max-w-sm group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-red-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Hakem adı, klasman veya bölge ara..."
                        className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all text-zinc-800 dark:text-zinc-200 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {filteredForms.length > 0 && (
                    <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                        {filteredForms.length} kayıt gösteriliyor
                    </p>
                )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

                {/* Desktop Table View (md and above) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px]">
                        <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-medium text-xs tracking-wide">
                            <tr>
                                <th className="px-4 py-4 lg:px-6">Ad Soyad</th>
                                <th className="px-4 py-4 lg:px-6">Klasman/Görev</th>
                                <th className="px-4 py-4 lg:px-6 hidden lg:table-cell">Bölge</th>
                                <th className="px-4 py-4 lg:px-6 hidden xl:table-cell">Son Güncelleme</th>
                                <th className="px-4 py-4 lg:px-6 text-right">Detaylar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {filteredForms.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        {searchTerm ? "Arama kriterlerine uygun kayıt bulunamadı." : "Bu hafta için henüz bildirim yapılmamış."}
                                    </td>
                                </tr>
                            ) : filteredForms.map((form) => {
                                const profile = form.referee || form.official;
                                if (!profile) return null;

                                return (
                                    <React.Fragment key={form.id}>
                                        <tr className={`transition-colors ${expandedId === form.id ? "bg-zinc-50 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                                            <td className="px-4 py-4 lg:px-6 font-medium text-zinc-900 dark:text-white">
                                                <HighlightText text={`${profile.firstName} ${profile.lastName}`.toLocaleUpperCase('tr-TR')} highlight={searchTerm} />
                                            </td>
                                            <td className="px-4 py-4 lg:px-6">
                                                {(() => {
                                                    const isGeneralOfficial = !!form.official;
                                                    const displayText = isGeneralOfficial
                                                        ? formatOfficialType(form.official?.officialType || "TABLE")
                                                        : formatClassification(form.referee?.classification || "İl Hakemi");
                                                    const bgColor = isGeneralOfficial
                                                        ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

                                                    return (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
                                                            <HighlightText text={displayText} highlight={searchTerm} />
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-4 lg:px-6 text-zinc-500 hidden lg:table-cell">
                                                <HighlightText text={profile.regions.map((r: any) => r.name).join(", ")} highlight={searchTerm} />
                                            </td>
                                            <td className="px-4 py-4 lg:px-6 text-zinc-500 hidden xl:table-cell text-xs">
                                                {new Date(form.updatedAt).toLocaleString("tr-TR")}
                                            </td>
                                            <td className="px-4 py-4 lg:px-6 text-right">
                                                <button
                                                    onClick={() => toggleExpand(form.id)}
                                                    className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                                                    title="Detayları Göster"
                                                >
                                                    {expandedId === form.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </td>
                                        </tr>

                                        {expandedId === form.id && (
                                            <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                                <td colSpan={5} className="px-4 py-4 lg:px-6">
                                                    {/* Show region/date inline on smaller screens where columns are hidden */}
                                                    <div className="flex flex-wrap gap-2 mb-3 lg:hidden text-xs text-zinc-500">
                                                        <span>Bölge: {profile.regions.map((r: any) => r.name).join(", ") || "—"}</span>
                                                        <span className="xl:hidden">· Güncelleme: {new Date(form.updatedAt).toLocaleString("tr-TR")}</span>
                                                    </div>
                                                    <DayGrid form={form} isMobile={false} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card List View (below md) */}
                <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredForms.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            {searchTerm ? "Arama kriterlerine uygun kayıt bulunamadı." : "Bu hafta için henüz bildirim yapılmamış."}
                        </div>
                    ) : filteredForms.map((form) => {
                        const profile = form.referee || form.official;
                        if (!profile) return null;

                        return (
                            <div key={form.id} className="bg-white dark:bg-zinc-900">
                                {/* Card Header */}
                                <div
                                    className="flex justify-between items-start cursor-pointer p-4 active:bg-zinc-50 dark:active:bg-zinc-800/50 transition-colors"
                                    onClick={() => toggleExpand(form.id)}
                                >
                                    <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                                        <h3 className="font-semibold text-zinc-900 dark:text-white text-base leading-tight">
                                            <HighlightText text={`${profile.firstName} ${profile.lastName}`.toLocaleUpperCase('tr-TR')} highlight={searchTerm} />
                                        </h3>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            {(() => {
                                                const isGeneralOfficial = !!form.official;
                                                const displayText = isGeneralOfficial
                                                    ? formatOfficialType(form.official!.officialType)
                                                    : formatClassification(form.referee!.classification);
                                                const bgColor = isGeneralOfficial
                                                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

                                                return (
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
                                                        <HighlightText text={displayText} highlight={searchTerm} />
                                                    </span>
                                                );
                                            })()}
                                            {profile.regions.length > 0 && (
                                                <span className="text-xs text-zinc-500">
                                                    <HighlightText text={profile.regions.map((r: any) => r.name).join(", ")} highlight={searchTerm} />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-zinc-400">
                                            {new Date(form.updatedAt).toLocaleString("tr-TR")}
                                        </p>
                                    </div>
                                    <div className="shrink-0 p-1 text-zinc-400">
                                        {expandedId === form.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* Mobile Expanded Details */}
                                {expandedId === form.id && (
                                    <div className="px-4 pb-4">
                                        <DayGrid form={form} isMobile={true} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
