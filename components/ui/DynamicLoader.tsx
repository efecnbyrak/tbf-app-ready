"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const LOADING_TEXTS = [
    "Veriler yükleniyor...",
    "Sistem hazırlanıyor...",
    "Bağlantı kuruluyor...",
    "İçerik getiriliyor...",
    "Son kontroller yapılıyor...",
];

export function DynamicLoader() {
    const [textIndex, setTextIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setTextIndex((prev) => (prev + 1) % LOADING_TEXTS.length);
                setFade(true);
            }, 300); // 300ms for text to disappear before changing
        }, 2000); // text changes every 2 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm border border-zinc-200/50 dark:border-zinc-800/50 shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-red-600/20 rounded-full blur-xl animate-pulse"></div>
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-full shadow-lg relative z-10">
                        <Loader2 className="w-12 h-12 text-red-600 animate-spin" strokeWidth={2.5} />
                    </div>
                </div>
                
                <div className="flex flex-col items-center gap-1 min-w-[200px]">
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">BKS Yükleniyor</h3>
                    <p 
                        className={`text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
                            fade ? "opacity-100 translate-y-0 text-red-600 dark:text-red-500" : "opacity-0 translate-y-1 text-zinc-400"
                        }`}
                    >
                        {LOADING_TEXTS[textIndex]}
                    </p>
                </div>
                
                {/* Progress Bar Animation */}
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                    <div className="h-full bg-red-600 rounded-full w-1/3 animate-[progress_1s_ease-in-out_infinite_alternate]"></div>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
}
