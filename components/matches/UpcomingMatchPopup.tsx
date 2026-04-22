"use client";

import { useEffect, useState } from "react";
import { getUpcomingUserMatches } from "@/app/actions/matches";
import { X, Calendar, MapPin, Clock, Trophy, Sparkles } from "lucide-react";

export function UpcomingMatchPopup() {
    const [matches, setMatches] = useState<any[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkUpcomingMatches = async () => {
            // Check if we already showed it this session
            const hasSeenPopup = sessionStorage.getItem("upcomingMatchShown");
            if (hasSeenPopup) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await getUpcomingUserMatches();
                if (result.success && result.matches.length > 0) {
                    setMatches(result.matches);
                    setIsOpen(true);
                    sessionStorage.setItem("upcomingMatchShown", "true");
                }
            } catch (error) {
                console.error("Failed to fetch upcoming matches for popup", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkUpcomingMatches();
    }, []);

    if (isLoading || !isOpen || matches.length === 0) return null;

    const match = matches[0]; // Show the most imminent match

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 overflow-hidden relative animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col">
                
                {/* Close Button */}
                <button 
                    onClick={() => setIsOpen(false)}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 hover:bg-white/40 dark:bg-zinc-800/50 dark:hover:bg-zinc-700 backdrop-blur-md rounded-full flex items-center justify-center transition-colors text-zinc-900 dark:text-white"
                >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {/* Header Header */}
                <div className="bg-gradient-to-br from-red-600 to-red-800 p-5 sm:p-8 text-center relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl mx-auto flex items-center justify-center mb-3 sm:mb-4 rotate-3 shadow-xl">
                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black text-white uppercase italic tracking-tighter mb-1 relative z-10">Yaklaşan Maçınız Var!</h2>
                    <p className="text-red-100 font-medium text-xs sm:text-sm">Sisteme hoş geldiniz, görevli olduğunuz yeni bir müsabaka bulunuyor.</p>
                </div>

                {/* Match Details */}
                <div className="p-5 sm:p-8 overflow-y-auto">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 sm:p-6 border border-zinc-100 dark:border-zinc-700/50 space-y-4 mb-5 sm:mb-8">
                        
                        <div className="flex items-center gap-3 sm:gap-4 border-b border-zinc-200 dark:border-zinc-700/50 pb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                                {(() => {
                                    const macAdiStr = match?.mac_adi || "";
                                    let takim1 = macAdiStr;
                                    let takim2 = "";
                                    if (macAdiStr.includes("-")) {
                                        const parts = macAdiStr.split("-");
                                        takim1 = parts[0].trim();
                                        takim2 = parts.slice(1).join("-").trim();
                                    }

                                    if (takim2) {
                                        return (
                                            <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white leading-tight uppercase line-clamp-2 sm:line-clamp-3">
                                                {takim1} <br/>
                                                <span className="text-zinc-400 dark:text-zinc-500 text-xs sm:text-sm">vs</span> <br/>
                                                {takim2}
                                            </h3>
                                        );
                                    }
                                    return (
                                        <h3 className="font-black text-sm sm:text-base text-zinc-900 dark:text-white leading-tight uppercase line-clamp-2 sm:line-clamp-3">
                                            {takim1}
                                        </h3>
                                    );
                                })()}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-2">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 text-red-600 dark:text-red-500">
                                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-500">Tarih</p>
                                    <p className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">{match.tarih}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-500">
                                    <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-500">Saat</p>
                                    <p className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">{match.saat}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 col-span-2">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-500">
                                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] sm:text-[10px] uppercase font-bold text-zinc-500">Salon</p>
                                    <p className="font-bold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">{match.salon}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold py-4 rounded-xl transition-colors uppercase text-sm tracking-wider"
                        >
                            Kapat
                        </button>
                    </div>
                </div>
                
            </div>
        </div>
    );
}
