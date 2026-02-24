"use client";

import { ShieldCheck, User } from "lucide-react";

interface AdminRowProps {
    admin: {
        id: number;
        tckn: string;
        role: { name: string };
        createdAt: Date;
    };
    isCurrentUser: boolean;
}

export function AdminRow({ admin, isCurrentUser }: AdminRowProps) {
    const isSuper = admin.role.name === "SUPER_ADMIN";

    return (
        <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Row Layout */}
            <div className="flex items-center px-8 py-5">
                <div className="flex-1 flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isSuper
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-800"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-700"
                        }`}>
                        {isSuper ? <ShieldCheck className="w-8 h-8" /> : <User className="w-8 h-8" />}
                    </div>
                    <div>
                        <div className="font-black text-xl text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic flex items-center gap-2">
                            {admin.tckn}
                            {isCurrentUser && (
                                <span className="px-2 py-0.5 bg-zinc-900 text-white dark:bg-white dark:text-black text-[8px] font-black tracking-widest rounded-md not-italic">SEN</span>
                            )}
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">
                            Kayıt: {new Date(admin.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                    </div>
                </div>

                <div className="hidden sm:block">
                    <span className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] italic uppercase ${isSuper
                        ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                        : "bg-zinc-900 text-white dark:bg-zinc-800"
                        }`}>
                        {isSuper ? "SÜPER YÖNETİCİ" : "YÖNETİCİ"}
                    </span>
                </div>
            </div>
        </div>
    );
}

