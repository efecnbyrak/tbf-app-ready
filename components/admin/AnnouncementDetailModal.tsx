"use client";

import { useEffect } from "react";
import { X, Calendar, Megaphone, Users } from "lucide-react";

interface AnnouncementDetailModalProps {
    announcement: any;
    onClose: () => void;
}

export function AnnouncementDetailModal({ announcement, onClose }: AnnouncementDetailModalProps) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    if (!announcement) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300 p-4 sm:p-6"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 overflow-hidden flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 sm:p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight line-clamp-2">
                                {announcement.subject}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-200/50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {new Date(announcement.createdAt).toLocaleString('tr-TR', {
                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    <Users className="w-3.5 h-3.5" />
                                    {announcement.target === 'ALL' ? 'TÜM KULLANICILAR' : announcement.target} ({announcement.sentCount} KİŞİ)
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Floating Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 rounded-xl transition-all shadow-sm hover:scale-110 active:scale-95 z-10 shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Body */}
                <div className="p-6 sm:p-8 overflow-y-auto modern-scrollbar">
                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none w-full whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                        {announcement.content}
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-lg active:scale-95"
                    >
                        KAPAT
                    </button>
                </div>
            </div>
        </div>
    );
}
