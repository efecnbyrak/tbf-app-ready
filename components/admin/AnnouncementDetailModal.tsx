"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Megaphone, Users, Trash2, Loader2 } from "lucide-react";
import { deleteAnnouncement, getAnnouncementReadReceipts, markAnnouncementAsRead } from "@/app/actions/announcements";
import { useRouter } from "next/navigation";

interface AnnouncementDetailModalProps {
    announcement: any;
    onClose: () => void;
}

export function AnnouncementDetailModal({ announcement, onClose }: AnnouncementDetailModalProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);
    const [showReads, setShowReads] = useState(false);
    const [readsData, setReadsData] = useState<any[]>([]);
    const [isLoadingReads, setIsLoadingReads] = useState(false);

    useEffect(() => {
        document.body.style.overflow = "hidden";
        
        const markRead = async () => {
            if (announcement && !announcement.isRead) {
                await markAnnouncementAsRead(announcement.id);
            }
        };
        markRead();

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [announcement, onClose]);

    const handleDelete = async () => {
        if (!confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
        setIsDeleting(true);
        const res = await deleteAnnouncement(announcement.id);
        if (res.success) {
            router.refresh(); // Refresh the list in the background
            onClose(); // Close the modal
        } else {
            alert(res.message || "Silme işlemi başarısız.");
            setIsDeleting(false);
        }
    };

    const handleShowReads = async () => {
        setIsLoadingReads(true);
        setShowReads(true);
        const res = await getAnnouncementReadReceipts(announcement.id);
        if(res.success) {
            setReadsData(res.data);
        }
        setIsLoadingReads(false);
    };

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
                                {!showReads && (
                                    <button onClick={handleShowReads} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                                        Tümünü Gör
                                    </button>
                                )}
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
                    {showReads ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-zinc-900 dark:text-white">Okunma Durumu</h3>
                                <button onClick={() => setShowReads(false)} className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white">Geri Dön</button>
                            </div>
                            {isLoadingReads ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-zinc-500" /></div>
                            ) : (
                                <div className="grid gap-2">
                                    {readsData.map((r, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden shrink-0">
                                                    {r.imageUrl ? <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">{r.name.charAt(0)}</div>}
                                                </div>
                                                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.name}</span>
                                            </div>
                                            {r.hasRead ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">Okudu</span>
                                                    {r.readAt && <span className="text-[10px] text-zinc-500 mt-1">{new Date(r.readAt).toLocaleString('tr-TR')}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-xs font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">Okumadı</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div 
                            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none w-full whitespace-pre-wrap text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed" 
                            dangerouslySetInnerHTML={{ __html: announcement.content }} 
                        />
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 shrink-0 flex items-center justify-between">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-100/50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 text-red-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        SİL
                    </button>
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
