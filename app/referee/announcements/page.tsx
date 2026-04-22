"use client";

import { useState, useEffect } from "react";
import { Megaphone, CheckCircle2, Clock, ChevronRight, Loader2 } from "lucide-react";
import { getAnnouncements, markAnnouncementAsRead } from "@/app/actions/announcements";

interface AnnouncementItem {
    id: number;
    subject: string;
    content: string;
    createdAt: Date;
    isRead: boolean;
}

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null);

    useEffect(() => {
        loadAnnouncements();
    }, []);

    const loadAnnouncements = async () => {
        setLoading(true);
        try {
            const data = await getAnnouncements();
            setAnnouncements(data.map((a: any) => ({
                ...a,
                createdAt: new Date(a.createdAt)
            })));
        } catch (error) {
            console.error("Failed to load announcements:", error);
        }
        setLoading(false);
    };

    const handleSelect = async (id: number) => {
        if (selectedId === id) {
            setSelectedId(null);
            return;
        }
        setSelectedId(id);

        const item = announcements.find(a => a.id === id);
        if (item && !item.isRead) {
            await markAnnouncementAsRead(id);
            setAnnouncements(prev =>
                prev.map(a => a.id === id ? { ...a, isRead: true } : a)
            );
        }
    };

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("tr-TR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
    };

    const unreadCount = announcements.filter(a => !a.isRead).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900 dark:text-white">Duyurular</h1>
                        <p className="text-xs text-zinc-500">Sistem duyurularınız burada listelenir.</p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {unreadCount} okunmamış
                    </span>
                )}
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center">
                    <Megaphone className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-zinc-500 font-bold">Henüz duyuru yok</h3>
                    <p className="text-zinc-400 text-sm mt-1">Yeni duyurular burada görünecek.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((item) => (
                        <div
                            key={item.id}
                            className={`bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden transition-all cursor-pointer ${
                                !item.isRead
                                    ? "border-purple-300 dark:border-purple-800 shadow-md shadow-purple-100 dark:shadow-purple-900/20"
                                    : "border-zinc-200 dark:border-zinc-800"
                            } ${selectedId === item.id ? "ring-2 ring-red-600/30" : ""}`}
                            onClick={() => handleSelect(item.id)}
                        >
                            {/* Announcement Header */}
                            <div className="flex items-center gap-4 p-4">
                                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                    !item.isRead ? "bg-purple-600 animate-pulse" : "bg-zinc-300 dark:bg-zinc-700"
                                }`} />

                                <div className="flex-1 min-w-0">
                                    <h3 className={`font-bold text-sm truncate ${
                                        !item.isRead ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"
                                    }`}>
                                        {item.subject}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="w-3 h-3 text-zinc-400" />
                                        <span className="text-[11px] text-zinc-400">{formatDate(item.createdAt)}</span>
                                        {item.isRead && (
                                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                                                <CheckCircle2 className="w-3 h-3" /> Okundu
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronRight className={`w-4 h-4 text-zinc-400 transition-transform ${
                                    selectedId === item.id ? "rotate-90" : ""
                                }`} />
                            </div>

                            {/* Expanded Content */}
                            {selectedId === item.id && (
                                <div className="px-4 pb-4 pt-0 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                                    <div 
                                        className="mt-4 text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: item.content }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
