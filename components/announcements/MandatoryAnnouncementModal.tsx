"use client";

import { useState, useEffect } from "react";
import { Megaphone, CheckCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface Announcement {
    id: number;
    subject: string;
    content: string;
    createdAt: string;
}

export function MandatoryAnnouncementModal() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isMarking, setIsMarking] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const res = await fetch("/api/announcements/unread-list");
                if (res.ok) {
                    const data = await res.json();
                    if (data.announcements && data.announcements.length > 0) {
                        setAnnouncements(data.announcements);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch unread announcements", e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUnread();
    }, []);

    const handleRead = async (id: number) => {
        if (isMarking) return;
        setIsMarking(true);

        try {
            const formData = new FormData();
            formData.append("announcementId", id.toString());
            
            await fetch("/api/announcements/mark-read", {
                method: "POST",
                body: formData
            });

            // Move to next announcement
            setCurrentIndex(prev => prev + 1);
            router.refresh(); // optionally refresh page state
        } catch (e) {
            console.error("Error marking announcement as read", e);
        } finally {
            setIsMarking(false);
        }
    };

    // Do not render anything if loading or no more announcements
    if (isLoading || announcements.length === 0 || currentIndex >= announcements.length) {
        return null;
    }

    const currentAnnouncement = announcements[currentIndex];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
                {/* Decorative header */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-br from-red-600 to-red-900 opacity-20 dark:opacity-40" />
                
                <div className="relative p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 shrink-0">
                            <Megaphone className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Yeni Duyuru</h2>
                            <p className="text-xs font-bold text-red-600 uppercase tracking-widest">{currentIndex + 1} / {announcements.length}</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">{currentAnnouncement.subject}</h3>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap max-h-64 overflow-y-auto modern-scrollbar">
                            {currentAnnouncement.content}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-bold uppercase mt-4">
                            Tarih: {new Date(currentAnnouncement.createdAt).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>

                    <button
                        onClick={() => handleRead(currentAnnouncement.id)}
                        disabled={isMarking}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl transition-all shadow-xl shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wide"
                    >
                        {isMarking ? (
                            "Onaylanıyor..."
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                Okudum, Anladım
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[10px] text-zinc-500 mt-4 font-medium italic">
                        Sistemi kullanmaya devam etmek için bu duyuruyu onaylamanız gerekmektedir.
                    </p>
                </div>
            </div>
        </div>
    );
}
