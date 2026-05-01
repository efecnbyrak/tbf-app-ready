"use client";

import { useEffect } from "react";
import { X, Shield } from "lucide-react";
import { KvkkContent } from "./KvkkContent";

interface KvkkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function KvkkModal({ isOpen, onClose }: KvkkModalProps) {
    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.stopPropagation();
                onClose();
            }
        };
        document.addEventListener("keydown", handleEscape, true);
        return () => {
            document.removeEventListener("keydown", handleEscape, true);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-3xl flex flex-col max-h-[90dvh] overflow-hidden animate-in zoom-in-95 duration-200 m-2"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-red-700 px-5 py-4 text-white relative overflow-hidden shrink-0 flex items-start justify-between gap-3">
                    <div className="absolute right-0 top-0 opacity-10 -translate-y-1/4 translate-x-1/4 pointer-events-none">
                        <Shield className="w-40 h-40" />
                    </div>
                    <div className="relative z-10 min-w-0">
                        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight italic leading-tight">KVKK & AÇIK RIZA METNİ</h2>
                        <p className="text-[10px] sm:text-xs text-red-100 mt-1 font-bold uppercase tracking-wide">
                            Basketbol Koordinasyon Sistemi (BKS)
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="relative z-10 p-2 -m-1 rounded-full hover:bg-white/15 transition-colors shrink-0"
                        aria-label="Kapat"
                        type="button"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <div className="p-5 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
                    <KvkkContent variant="modal" />
                </div>

                <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-50 dark:bg-zinc-950 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 bg-zinc-900 dark:bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:opacity-90 transition-all"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}
