"use client";

import { useState } from "react";
import { History, X, Calendar, ChevronDown, ChevronUp } from "lucide-react";

export function PastAvailabilitiesModal({ pastForms }: { pastForms: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedFormId, setExpandedFormId] = useState<number | null>(null);

    // Filter out forms that have no days to show
    const validForms = pastForms?.filter(f => f.days && f.days.length > 0) || [];

    if (validForms.length === 0) return null;

    const toggleExpand = (id: number) => {
        setExpandedFormId(prev => prev === id ? null : id);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded-xl transition-colors text-sm font-semibold border border-zinc-200 dark:border-zinc-700 shadow-sm"
            >
                <History className="w-4 h-4" />
                Önceki Uygunluklarım
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                                <History className="text-red-600" /> Geçmiş Uygunluk Formları
                            </h2>
                            <button onClick={() => setIsOpen(false)} className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full transition-colors">
                                <X size={20} className="text-zinc-500" />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 space-y-4">
                            {validForms.map(form => {
                                const start = new Date(form.weekStartDate);
                                const end = new Date(start);
                                end.setDate(end.getDate() + 6);
                                const periodTitle = `${start.toLocaleDateString("tr-TR")} - ${end.toLocaleDateString("tr-TR")}`;
                                const isExpanded = expandedFormId === form.id;

                                // Sort days chronologically
                                const sortedDays = [...form.days].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                return (
                                    <div key={form.id} className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-zinc-50/50 dark:bg-zinc-900/50 transition-colors">
                                        <button
                                            onClick={() => toggleExpand(form.id)}
                                            className="w-full flex items-center justify-between p-4 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center shrink-0">
                                                    <Calendar className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-zinc-800 dark:text-zinc-200">{periodTitle}</div>
                                                    <div className="text-xs text-zinc-500 mt-0.5">
                                                        Durum: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{form.status === "SUBMITTED" ? "Gönderildi" : form.status}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-zinc-400 p-2">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {sortedDays.map((day: any) => {
                                                    const d = new Date(day.date);
                                                    const isAvailable = day.slots !== "Uygun Değil";

                                                    return (
                                                        <div key={day.id} className={`p-3 rounded-xl border text-sm ${isAvailable ? 'bg-white dark:bg-zinc-800 border-green-200 dark:border-green-900' : 'bg-transparent border-zinc-200 dark:border-zinc-800 opacity-60'}`}>
                                                            <div className={`font-semibold mb-1 ${isAvailable ? 'text-green-700 dark:text-green-400' : 'text-zinc-500'}`}>
                                                                {d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                            </div>
                                                            <div className={`font-bold ${isAvailable ? 'text-zinc-800 dark:text-zinc-200' : 'text-zinc-400'}`}>
                                                                {day.slots}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
