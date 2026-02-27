"use client";

import { UserSquare2, ChevronRight, ShieldCheck, Activity, UserX, UserCheck, MapPin } from "lucide-react";
import { formatRelative } from "date-fns";
import { tr } from "date-fns/locale";
import { CLASSIFICATIONS, OFFICIAL_TYPES } from "@/lib/constants";

interface OfficialRowProps {
    official: any;
    onClick: () => void;
    onToggleActive?: () => void;
    onPromote?: () => void;
    isSuperAdmin?: boolean;
}

export function OfficialRow({ official, onClick, onToggleActive, onPromote, isSuperAdmin }: OfficialRowProps) {
    const isReferee = official.officialType === "REFEREE";
    const isActive = (official.user?.isActive ?? true);

    // Check if suspended
    const isSuspended = official.user?.suspendedUntil && new Date(official.user.suspendedUntil) > new Date();

    // Get readable labels
    const classLabel = CLASSIFICATIONS.find(c => c.id === official.classification)?.label || official.classification || "BELİRTİLMEMİŞ";
    const typeLabel = OFFICIAL_TYPES.find(t => t.id === official.officialType)?.label || official.officialType;
    const regionName = official.regions?.[0]?.name || "Bölge Yok";

    return (
        <div
            onClick={onClick}
            className={`group flex flex-col sm:flex-row sm:items-center gap-4 p-5 mb-4 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all cursor-pointer shadow-sm relative ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            {/* Left Section: Avatar & Name */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 shrink-0 border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-inner">
                    {official.imageUrl ? (
                        <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                    ) : (
                        <img src="/hakem/defaultHakem.png" alt="Default" className="w-full h-full object-cover" />
                    )}
                    {isSuspended && (
                        <div className="absolute inset-0 bg-red-600/10 backdrop-blur-[1px] flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-zinc-900 dark:text-white truncate uppercase tracking-tight">
                            {official.firstName} {official.lastName}
                        </h3>
                        {official.user?.role?.name === "SUPER_ADMIN" && <ShieldCheck className="w-4 h-4 text-orange-500" />}
                        {official.user?.role?.name === "ADMIN" && (
                            <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest rounded-md">YÖNETİCİ</span>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                        {isReferee && (
                            <>
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{classLabel}</span>
                                <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full hidden sm:block" />
                            </>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isReferee ? 'text-red-600' : 'text-zinc-500'}`}>
                            {typeLabel}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Section: Location & Status */}
            <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col sm:items-end">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">{regionName}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-bold text-zinc-400">Son:</span>
                        <span className="text-[9px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-tighter">
                            {official.user?.lastLoginAt
                                ? formatRelative(new Date(official.user.lastLoginAt), new Date(), { locale: tr })
                                : 'Hic Giriş Yapılmadı'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onToggleActive && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
                            className={`p-3 rounded-2xl transition-all ${isActive ? 'text-zinc-400 hover:text-red-600 bg-zinc-50 dark:bg-zinc-800' : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'}`}
                            title={isActive ? "Pasife Al" : "Aktif Et"}
                        >
                            {isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                        </button>
                    )}
                    <div className="p-3 text-zinc-300 group-hover:text-red-600 group-hover:translate-x-1 transition-all">
                        <ChevronRight className="w-6 h-6 stroke-[3]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
