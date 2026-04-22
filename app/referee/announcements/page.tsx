"use client";

import { useState, useEffect } from "react";
import { Megaphone, CheckCircle2, Clock, ChevronDown, Loader2, Bell, Mail, MailOpen } from "lucide-react";
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
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center animate-pulse">
                    <Megaphone className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                <p className="text-sm text-zinc-500 font-medium">Duyurular yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl sm:rounded-[2rem] p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/4 translate-x-1/4 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4 pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                            <Megaphone className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Duyurular</h1>
                            <p className="text-purple-200 text-xs font-bold uppercase tracking-widest">Sistem Bildirim Merkezi</p>
                        </div>
                    </div>
                    {unreadCount > 0 ? (
                        <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 px-4 py-2 rounded-xl self-start sm:self-auto">
                            <Bell className="w-4 h-4 text-white animate-pulse" />
                            <span className="text-white text-sm font-black">{unreadCount} okunmamış</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 bg-white/10 border border-white/10 px-4 py-2 rounded-xl self-start sm:self-auto">
                            <CheckCircle2 className="w-4 h-4 text-purple-200" />
                            <span className="text-purple-200 text-sm font-bold">Tümü okundu</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Announcements List */}
            {announcements.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 text-center">
                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Megaphone className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-zinc-600 dark:text-zinc-400 font-black uppercase italic tracking-tight mb-1">Henüz duyuru yok</h3>
                    <p className="text-zinc-400 text-sm">Yeni duyurular burada görünecek.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {announcements.map((item, index) => (
                        <div
                            key={item.id}
                            className={`group bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden transition-all cursor-pointer shadow-sm hover:shadow-lg border-l-4 ${
                                !item.isRead
                                    ? "border-l-purple-500 border border-purple-100 dark:border-purple-900/40"
                                    : "border-l-zinc-200 dark:border-l-zinc-700 border border-zinc-100 dark:border-zinc-800"
                            } ${selectedId === item.id ? "ring-2 ring-purple-500/30 shadow-purple-100 dark:shadow-purple-900/20" : ""}`}
                            onClick={() => handleSelect(item.id)}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Announcement Header */}
                            <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
                                {/* Icon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                    !item.isRead
                                        ? "bg-purple-100 dark:bg-purple-900/30"
                                        : "bg-zinc-100 dark:bg-zinc-800"
                                }`}>
                                    {item.isRead
                                        ? <MailOpen className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                                        : <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    }
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        {!item.isRead && (
                                            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shrink-0" />
                                        )}
                                        <h3 className={`font-black text-sm truncate tracking-tight ${
                                            !item.isRead
                                                ? "text-zinc-900 dark:text-white"
                                                : "text-zinc-500 dark:text-zinc-400"
                                        }`}>
                                            {item.subject}
                                        </h3>
                                    </div>
                                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-zinc-400" />
                                            <span className="text-[11px] text-zinc-400">{formatDate(item.createdAt)}</span>
                                        </div>
                                        {item.isRead && (
                                            <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-black uppercase tracking-wide">
                                                <CheckCircle2 className="w-3 h-3" /> Okundu
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <ChevronDown className={`w-5 h-5 text-zinc-400 transition-transform shrink-0 ${
                                    selectedId === item.id ? "rotate-180" : ""
                                } group-hover:text-purple-500`} />
                            </div>

                            {/* Expanded Content */}
                            {selectedId === item.id && (
                                <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-zinc-100 dark:border-zinc-800 animate-in slide-in-from-top-2 duration-200">
                                    <div
                                        className="mt-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-xl border border-zinc-100 dark:border-zinc-800 prose prose-sm dark:prose-invert max-w-none"
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
