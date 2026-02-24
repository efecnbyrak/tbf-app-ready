
"use client";

import { useState } from "react";
import { Trash2, AlertTriangle, Key, ShieldCheck, User } from "lucide-react";
import { deleteAdmin } from "@/app/actions/auth";

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
    const [status, setStatus] = useState<"idle" | "confirm" | "deleting">("idle");

    const handleDelete = async () => {
        if (status === "idle") {
            setStatus("confirm");
            setTimeout(() => setStatus("idle"), 3000); // 3 saniye sonra iptal
            return;
        }

        if (status === "confirm") {
            setStatus("deleting");
            const result = await deleteAdmin(admin.id);
            if (result.error) {
                alert(result.error);
                setStatus("idle");
            }
        }
    };

    const isSuper = admin.role.name === "SUPER_ADMIN";

    return (
        <div className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            {/* Desktop Table-like Row (Flex) */}
            <div className="hidden md:flex items-center px-6 py-4">
                <div className="flex-1 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSuper ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                        {isSuper ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div>
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">{admin.tckn}</div>
                        <div className="text-xs text-zinc-500">{new Date(admin.createdAt).toLocaleDateString('tr-TR')} tarihinde eklendi</div>
                    </div>
                </div>

                <div className="w-32">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-tight ${isSuper
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                        {isSuper ? "SÜPER ADMİN" : "ADMİN"}
                    </span>
                </div>

                <div className="w-32 text-right">
                    {isCurrentUser ? (
                        <span className="text-xs font-medium text-zinc-400 italic">Sen</span>
                    ) : (
                        <button
                            onClick={handleDelete}
                            disabled={status === "deleting"}
                            className={`
                                flex items-center gap-2 ml-auto px-4 py-2 rounded-xl text-sm font-bold transition-all
                                ${status === "confirm"
                                    ? "bg-red-600 text-white animate-pulse"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                }
                                disabled:opacity-50
                            `}
                        >
                            {status === "confirm" ? (
                                <><AlertTriangle className="w-4 h-4" /> Emin misin?</>
                            ) : status === "deleting" ? (
                                "Siliniyor..."
                            ) : (
                                <><Trash2 className="w-4 h-4" /> Sil</>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-5 space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSuper ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600" : "bg-red-100 dark:bg-red-900/30 text-red-600"}`}>
                            {isSuper ? <ShieldCheck className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                        <div>
                            <div className="font-black text-lg text-zinc-900 dark:text-zinc-100">{admin.tckn}</div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-tighter ${isSuper
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                {isSuper ? "SÜPER ADMİN" : "ADMİN"}
                            </span>
                        </div>
                    </div>
                    {isCurrentUser ? (
                        <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">SEN</span>
                    ) : (
                        <button
                            onClick={handleDelete}
                            disabled={status === "deleting"}
                            className={`
                                p-3 rounded-2xl transition-all
                                ${status === "confirm"
                                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-red-500"
                                }
                            `}
                        >
                            {status === "confirm" ? <AlertTriangle className="w-6 h-6 animate-pulse" /> : <Trash2 className="w-6 h-6" />}
                        </button>
                    )}
                </div>
                {status === "confirm" && (
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 p-3 rounded-xl text-center">
                        <p className="text-red-600 dark:text-red-400 text-xs font-bold">
                            Silmek için tekrar basın. (3sn içinde iptal olur)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
