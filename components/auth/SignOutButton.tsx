"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, X, AlertTriangle } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function SignOutButton() {
    const [showConfirm, setShowConfirm] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowConfirm(false)}
        >
            <div
                className="bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-red-600/10">
                        <AlertTriangle className="w-10 h-10" />
                    </div>

                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight uppercase italic">
                        Emin misiniz?
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium italic mb-8">
                        Mevcut oturumunuz sonlandırılacak. Devam etmek istiyor musunuz?
                    </p>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleLogout}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs tracking-widest shadow-xl shadow-red-600/20 transition-all active:scale-95 uppercase"
                        >
                            EVET, ÇIKIŞ YAP
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-2xl font-black text-xs tracking-widest transition-all active:scale-95 uppercase"
                        >
                            VAZGEÇ
                        </button>
                    </div>
                </div>

                <button
                    onClick={() => setShowConfirm(false)}
                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    );

    return (
        <>
            <button
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 transition-colors group"
                onClick={() => setShowConfirm(true)}
            >
                <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Hesaptan Çıkış Yap</span>
            </button>

            {showConfirm && mounted && createPortal(modalContent, document.body)}
        </>
    );
}
