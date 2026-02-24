"use client";

import { UserSquare2, ChevronRight, ShieldCheck, Activity, UserX, UserCheck, Star } from "lucide-react";
import { formatRelative } from "date-fns";
import { tr } from "date-fns/locale";

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

    return (
        <div
            onClick={onClick}
            className={`group flex items-center gap-4 p-4 mb-3 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-red-500 transition-all cursor-pointer shadow-sm ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            {/* Minimal Avatar */}
            <div className="relative w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {official.imageUrl ? (
                    <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                ) : (
                    <img src="/hakem/defaultHakem.png" alt="Default" className="w-full h-full object-cover" />
                )}
                {isSuspended && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-red-600 border-2 border-white dark:border-zinc-900 rounded-full" title="Cezalı" />
                )}
            </div>

            {/* Main Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate uppercase">
                        {official.firstName} {official.lastName}
                    </h3>
                    {official.user?.role?.name === "SUPER_ADMIN" && <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-zinc-400">{official.classification || "BELİRTİLMEMİŞ"}</span>
                    <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                    <span className={`text-[9px] font-black uppercase ${isReferee ? 'text-red-600' : 'text-zinc-500'}`}>
                        {official.officialType}
                    </span>
                    {isReferee && (
                        <>
                            <span className="w-1 h-1 bg-zinc-300 rounded-full" />
                            <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-orange-400 fill-orange-400" />
                                <span className="text-[10px] font-bold text-zinc-900 dark:text-white italic">{official.points || 0} PN</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Status / Actions (Simplified) */}
            <div className="flex items-center gap-4 shrink-0">
                <div className="hidden md:flex flex-col items-end">
                    <p className="text-[10px] font-medium text-zinc-400">Son Giriş</p>
                    <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase">
                        {official.user?.lastLoginAt
                            ? formatRelative(new Date(official.user.lastLoginAt), new Date(), { locale: tr })
                            : 'Hic'}
                    </p>
                </div>

                <div className="flex items-center gap-1">
                    {onToggleActive && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
                            className={`p-2 rounded-lg transition-all ${isActive ? 'text-zinc-400 hover:text-red-600' : 'text-green-600 bg-green-50 dark:bg-green-900/20'}`}
                            title={isActive ? "Pasife Al" : "Aktif Et"}
                        >
                            {isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                    )}
                    <div className="p-2 text-zinc-300 group-hover:text-red-600 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                    </div>
                </div>
            </div>
        </div>
    );
}
