"use client";

import React, { useState } from "react";
import { Search, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { formatClassification } from "@/lib/format-utils";
import { Referee, Region, AvailabilityForm, AvailabilityDay } from "@prisma/client";

type AvailabilityFormWithDetails = AvailabilityForm & {
    referee: Referee & { regions: Region[]; officialType?: string };
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

    const filteredForms = forms.filter((form) => {
        const fullName = `${form.referee.firstName} ${form.referee.lastName}`.toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) ||
            form.referee.classification.toLowerCase().includes(search) ||
            form.referee.regions.some((r) => r.name.toLowerCase().includes(search));
    });

    const toggleExpand = (id: number) => {
        if (expandedId === id) setExpandedId(null);
        else setExpandedId(id);
    };

    // Helper for Highlighting Text
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

    return (
        <div>
            {/* Search Bar */}
            <div className="mb-6 flex justify-end">
                <div className="relative w-full md:w-80 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-red-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Hakem adı, klasman veya bölge ara..."
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all text-zinc-800 dark:text-zinc-200 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">

                {/* Desktop Table View */}
                <table className="w-full text-left text-sm hidden md:table">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase font-medium">
                        <tr>
                            <th className="px-6 py-4">Ad Soyad</th>
                            <th className="px-6 py-4">Klasman/Görev</th>
                            <th className="px-6 py-4">Bölge</th>
                            <th className="px-6 py-4">Son Güncelleme</th>
                            <th className="px-6 py-4 text-right">Detaylar</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {filteredForms.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                    {searchTerm ? "Arama kriterlerine uygun kayıt bulunamadı." : "Bu hafta için henüz bildirim yapılmamış."}
                                </td>
                            </tr>
                        ) : filteredForms.map((form) => (
                            <React.Fragment key={form.id}>
                                <tr className={`transition-colors ${expandedId === form.id ? "bg-zinc-50 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"}`}>
                                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-white">
                                        <HighlightText text={`${form.referee.firstName} ${form.referee.lastName}`} highlight={searchTerm} />
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const isGeneralOfficial = form.referee.officialType && form.referee.officialType !== "REFEREE";
                                            const typeLabels: Record<string, string> = {
                                                "TABLE": "Masa Görevlisi",
                                                "OBSERVER": "Gözlemci",
                                                "HEALTH": "Sağlıkçı",
                                                "STATISTICIAN": "İstatistikçi",
                                                "REFEREE": "Hakem"
                                            };
                                            const displayText = isGeneralOfficial
                                                ? (typeLabels[form.referee.officialType!] || form.referee.officialType)
                                                : formatClassification(form.referee.classification);
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
                                    <td className="px-6 py-4 text-zinc-500">
                                        <HighlightText text={form.referee.regions.map((r) => r.name).join(", ")} highlight={searchTerm} />
                                    </td>
                                    <td className="px-6 py-4 text-zinc-500">
                                        {new Date(form.updatedAt).toLocaleString("tr-TR")}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleExpand(form.id)}
                                            className="p-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 transition-colors"
                                            title="Detayları Göster"
                                        >
                                            {expandedId === form.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </button>
                                    </td>
                                </tr>

                                {/* Expanded Details Desktop */}
                                {expandedId === form.id && (
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                                        <td colSpan={5} className="px-6 py-4">
                                            <div className="grid grid-cols-4 gap-4 p-2">
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
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                {/* Mobile Card List View */}
                <div className="md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredForms.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            {searchTerm ? "Arama kriterlerine uygun kayıt bulunamadı." : "Bu hafta için henüz bildirim yapılmamış."}
                        </div>
                    ) : filteredForms.map((form) => (
                        <div key={form.id} className="p-4 bg-white dark:bg-zinc-900">
                            {/* Card Header: Info + Toggle Button */}
                            <div
                                className="flex justify-between items-start cursor-pointer"
                                onClick={() => toggleExpand(form.id)}
                            >
                                <div className="space-y-1">
                                    <h3 className="font-medium text-zinc-900 dark:text-white text-lg">
                                        <HighlightText text={`${form.referee.firstName} ${form.referee.lastName}`} highlight={searchTerm} />
                                    </h3>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {(() => {
                                            const isGeneralOfficial = form.referee.officialType && form.referee.officialType !== "REFEREE";
                                            const typeLabels: Record<string, string> = {
                                                "TABLE": "Masa Görevlisi",
                                                "OBSERVER": "Gözlemci",
                                                "HEALTH": "Sağlıkçı",
                                                "STATISTICIAN": "İstatistikçi",
                                                "REFEREE": "Hakem"
                                            };
                                            const displayText = isGeneralOfficial
                                                ? (typeLabels[form.referee.officialType!] || form.referee.officialType)
                                                : formatClassification(form.referee.classification);
                                            const bgColor = isGeneralOfficial
                                                ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";

                                            return (
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bgColor}`}>
                                                    <HighlightText text={displayText} highlight={searchTerm} />
                                                </span>
                                            );
                                        })()}
                                        <span className="text-sm text-zinc-500">
                                            <HighlightText text={form.referee.regions.map((r) => r.name).join(", ")} highlight={searchTerm} />
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        Güncelleme: {new Date(form.updatedAt).toLocaleString("tr-TR")}
                                    </p>
                                </div>
                                <button
                                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                                >
                                    {expandedId === form.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                            </div>

                            {/* Mobile Expanded Details */}
                            {expandedId === form.id && (
                                <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
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

                                        return (
                                            <div key={i} className={`
                                                flex justify-between items-center p-3 rounded-lg border text-sm
                                                ${isAvailable
                                                    ? "bg-green-50 border-green-200 text-green-900 dark:bg-zinc-900 dark:border-green-900 dark:text-green-400"
                                                    : "bg-zinc-50 border-zinc-100 text-zinc-400 dark:bg-zinc-900/50 dark:border-zinc-800"
                                                }
                                            `}>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="opacity-70" />
                                                    <span className="font-semibold">{d.toLocaleDateString("tr-TR", { weekday: "long" })}</span>
                                                </div>
                                                <span className="font-medium">{slot}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
