"use client";

import { useState, useEffect } from "react";
import {
    X, AlertCircle, Calendar, ShieldCheck,
    FileText, Gavel, History, ChevronRight
} from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface Penalty {
    id: number;
    type: string;
    reason: string;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
}

interface PenaltyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PenaltyModal({ isOpen, onClose }: PenaltyModalProps) {
    const [penalties, setPenalties] = useState<Penalty[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchPenalties();
        }
    }, [isOpen]);

    const fetchPenalties = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/penalties");
            if (res.ok) {
                const data = await res.json();
                setPenalties(data);
            }
        } catch (error) {
            console.error("Error fetching penalties:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "SUSPENSION": return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
            case "WARNING": return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
            case "FINE": return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
            default: return "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "SUSPENSION": return "Askıya Alma";
            case "WARNING": return "Uyarı";
            case "FINE": return "Para Cezası";
            default: return type;
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Atama Kısıtlama Kayıtları">
            <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <Gavel className="w-5 h-5 text-white dark:text-zinc-900" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase italic tracking-widest">Atama Kısıtlamaları</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-zinc-500 font-bold uppercase italic text-xs animate-pulse">Kayıtlar taranıyor...</p>
                    </div>
                ) : penalties.length === 0 ? (
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/20 dark:to-zinc-950 rounded-3xl p-10 border border-emerald-100 dark:border-emerald-800/50 text-center space-y-6 group">
                        <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                            <ShieldCheck size={160} />
                        </div>
                        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 border-4 border-white dark:border-zinc-900">
                            <ShieldCheck className="w-10 h-10 text-white" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-400">Herşey Yolunda</h3>
                            <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full" />
                            <p className="text-emerald-700 dark:text-emerald-500/80 font-medium italic">
                                Kayda geçmiş herhangi bir atama kısıtlamanız bulunmamaktadır.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {penalties.map((penalty) => (
                            <div
                                key={penalty.id}
                                className="group relative bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`px-4 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider ${getTypeColor(penalty.type)}`}>
                                            {getTypeLabel(penalty.type)}
                                        </div>
                                        {penalty.isActive && (
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold uppercase italic text-[10px] animate-pulse">
                                                <div className="w-1.5 h-1.5 bg-emerald-600 dark:bg-emerald-400 rounded-full" />
                                                Aktif
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-bold">
                                        <Calendar size={14} className="opacity-50" />
                                        {formatDate(penalty.startDate)}
                                        {penalty.endDate && (
                                            <>
                                                <ChevronRight size={12} className="opacity-30" />
                                                {formatDate(penalty.endDate)}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Kısıtlama Gerekçesi</h4>
                                    <p className="text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed">
                                        {penalty.reason}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="pt-4 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold uppercase italic tracking-tight hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </Modal>
    );
}
