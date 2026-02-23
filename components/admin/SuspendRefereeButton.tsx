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
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-3 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">
                        {isSuspended ? "Cezayı Güncelle" : "Hakemi Dondur"}
                    </h4>

                    <div className="space-y-3">
                        {!isSuspended && (
                            <div className="space-y-1">
                                <label className="text-[10px] text-zinc-400">Bitiş Tarihi:</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full text-xs p-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded outline-none focus:border-red-600"
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleSuspend}
                                disabled={loading || (!date && !isSuspended)}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-[10px] font-bold py-1.5 rounded transition-colors"
                            >
                                {loading ? "..." : isSuspended ? "Cezayı Kaldır" : "Onayla"}
                            </button>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-[10px] font-bold py-1.5 rounded transition-colors"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
