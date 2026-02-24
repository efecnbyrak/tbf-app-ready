"use client";

import { UserSquare2, ChevronRight, ShieldCheck, Activity, UserX, UserCheck } from "lucide-react";
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
    const isObserver = official.officialType === "OBSERVER";
    const isActive = official.user?.isActive ?? true;

    return (
        <div
            onClick={onClick}
            className={`group relative flex flex-col md:flex-row md:items-center justify-between p-5 mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md hover:border-red-200 dark:hover:border-red-900/30 transition-all cursor-pointer overflow-hidden ${!isActive ? 'opacity-60 grayscale-[0.5]' : ''}`}
        >
            {/* Passive Status Indicator */}
            {!isActive && (
                <div className="absolute top-0 right-0 px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-bl-xl">
                    PASİF HESAP
                </div>
            )}

            <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                    {official.imageUrl ? (
                        <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                    ) : (
                        <UserSquare2 className="w-8 h-8 text-zinc-400" />
                    )}

                    {/* Role Icon Overlay */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shadow-sm">
                        <Activity className={`w-3.5 h-3.5 ${isReferee ? 'text-red-600' : 'text-blue-600'}`} />
                    </div>
                </div>

                {/* Primary Info */}
                <div className="flex flex-col">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white leading-tight flex items-center gap-2">
                        {official.firstName} {official.lastName}
                        {official.user?.role?.name === "SUPER_ADMIN" && <ShieldCheck className="w-4 h-4 text-orange-500" />}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{official.classification}</span>
                        <span className="w-1 h-1 bg-zinc-300 dark:bg-zinc-700 rounded-full" />
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-tight ${isReferee ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                            {official.officialType === "REFEREE" ? "HAKEM" :
                                official.officialType === "OBSERVER" ? "GÖZLEMCİ" : "GENEL GÖREVLİ"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right Side Stats/Actions */}
            <div className="flex items-center justify-between md:justify-end gap-6 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-col md:items-end">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Son Giriş</p>
                    <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        {official.user?.lastLoginAt
                            ? formatRelative(new Date(official.user.lastLoginAt), new Date(), { locale: tr })
                            : 'Hiç giriş yapmadı'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Promote to Admin Button (Only for Super Admin and Observers) */}
                    {isSuperAdmin && isObserver && official.user?.role?.name !== "ADMIN" && official.user?.role?.name !== "SUPER_ADMIN" && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onPromote?.(); }}
                            title="Yönetici Yap"
                            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-orange-600 hover:text-white rounded-xl transition-all"
                        >
                            <ShieldCheck className="w-5 h-5" />
                        </button>
                    )}

                    {/* Active/Passive Toggle Button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggleActive?.(); }}
                        title={isActive ? "Pasif Yap" : "Aktif Yap"}
                        className={`p-2.5 rounded-xl transition-all ${isActive
                                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-red-600 hover:text-white'
                                : 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                            }`}
                    >
                        {isActive ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                    </button>

                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-400 rounded-xl group-hover:bg-red-50 dark:group-hover:bg-red-900/20 group-hover:text-red-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </div>
            </div>
        </div>
    );
}
