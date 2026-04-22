"use client";

import { useState, useEffect } from "react";
import { Trophy, Calendar, MapPin, Clock, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { parse, format } from "date-fns";
import { tr } from "date-fns/locale";

function parseTurkishDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/);
    if (match) {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
}

function formatDisplayDate(dateStr: string): string {
    const d = parseTurkishDate(dateStr);
    if (!d) return dateStr || "";
    return format(d, "d MMMM yyyy EEEE", { locale: tr });
}

export function AdminMatchesPreview() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const res = await fetch("/api/matches");
                const data = await res.json();
                
                if (res.ok && data.matches) {
                    const nowStartOfDay = new Date();
                    nowStartOfDay.setHours(0, 0, 0, 0);

                    // Filter upcoming matches
                    const upcoming = data.matches.filter((m: any) => {
                        const mDate = parseTurkishDate(m.tarih);
                        if (!mDate) return false;
                        if (mDate < nowStartOfDay) return false;
                        
                        if (mDate > nowStartOfDay) return true;
                        
                        // Same day logic
                        if (m.saat) {
                            const parts = m.saat.split(":");
                            if (parts.length >= 2) {
                                const matchTime = new Date(nowStartOfDay);
                                matchTime.setHours(parseInt(parts[0], 10) + 2, parseInt(parts[1], 10), 0, 0);
                                return new Date() <= matchTime;
                            }
                        }
                        return true;
                    });
                    
                    // Sort nearest first
                    upcoming.sort((a: any, b: any) => {
                        const dateA = parseTurkishDate(a.tarih)?.getTime() || 0;
                        const dateB = parseTurkishDate(b.tarih)?.getTime() || 0;
                        if (dateA !== dateB) return dateA - dateB;
                        
                        const saatA = a.saat || "23:59";
                        const saatB = b.saat || "23:59";
                        if (saatA < saatB) return -1;
                        if (saatA > saatB) return 1;
                        return 0;
                    });

                    setMatches(upcoming.slice(0, 5)); // top 5 upcoming
                }
            } catch (error) {
                console.error("Error fetching preview matches:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, []);

    if (loading) {
        return (
            <div className="mt-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
        );
    }

    if (matches.length === 0) return null;

    return (
        <div className="mt-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center shadow-inner">
                        <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Yaklaşan Maçlarım</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Sıradaki görevlendirmeleriniz</p>
                    </div>
                </div>
                
                <Link 
                    href="/admin/matches"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-zinc-300 transition-colors"
                >
                    Tümünü Gör
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match, idx) => (
                    <div key={idx} className="bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col hover:border-red-500/30 transition-colors group">
                        <h3 className="font-bold text-sm text-zinc-900 dark:text-white truncate mb-3 group-hover:text-red-600 transition-colors">
                            {match.mac_adi}
                        </h3>
                        <div className="mt-auto space-y-2">
                            {match.tarih && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDisplayDate(match.tarih)}
                                </div>
                            )}
                            {match.saat && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
                                    <Clock className="w-3.5 h-3.5" />
                                    {match.saat}
                                </div>
                            )}
                            {match.salon && (
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium truncate">
                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                    <span className="truncate">{match.salon}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
