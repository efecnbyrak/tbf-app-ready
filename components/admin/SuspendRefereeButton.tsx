"use client";

import { useState } from "react";
import { suspendUser } from "@/app/actions/admin-users";
import { ShieldOff, Calendar, Check, X } from "lucide-react";

interface SuspendRefereeButtonProps {
    userId: number;
    suspendedUntil?: string | null;
}

export function SuspendRefereeButton({ userId, suspendedUntil }: SuspendRefereeButtonProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);

    const isSuspended = suspendedUntil && new Date(suspendedUntil) > new Date();

    const handleSuspend = async () => {
        if (!date && !isSuspended) return;
        setLoading(true);
        try {
            await suspendUser(userId, date ? new Date(date) : null);
            setIsMenuOpen(false);
        } catch (error) {
            console.error(error);
            alert("İşlem başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title={isSuspended ? "Cezayı Kaldır" : "Ceza Ver (Dondur)"}
                className={`p-1.5 rounded-lg transition-colors ${isSuspended
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    }`}
            >
                <ShieldOff size={16} />
            </button>

            {isMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-72 bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border-2 border-zinc-100 dark:border-zinc-700 p-5 z-50 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200">
                    <div className="flex items-center gap-2 mb-4">
                        <ShieldOff className="w-5 h-5 text-red-600" />
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                            {isSuspended ? "Cezayı Güncelle" : "Hakemi Dondur"}
                        </h4>
                    </div>

                    <div className="space-y-5">
                        {!isSuspended && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-500 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Bitiş Tarihi Seçiniz:
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full text-sm font-medium p-3 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-700 rounded-xl outline-none focus:border-red-600 transition-all cursor-pointer"
                                />
                                <p className="text-[10px] text-zinc-400 italic">
                                    Bu tarihe kadar hakem uygunluk formu dolduramayacaktır.
                                </p>
                            </div>
                        )}

                        {isSuspended && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                                <p className="text-xs text-red-700 dark:text-red-400 font-medium text-center">
                                    Hesap şu an dondurulmuş durumda.
                                </p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleSuspend}
                                disabled={loading || (!date && !isSuspended)}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-black py-3 rounded-xl transition-all shadow-lg shadow-red-600/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? "..." : (
                                    <>
                                        {isSuspended ? <Check size={14} /> : <ShieldOff size={14} />}
                                        {isSuspended ? "Cezayı Kaldır" : "Cezayı Onayla"}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="px-4 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 text-xs font-black py-3 rounded-xl transition-colors active:scale-95"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
