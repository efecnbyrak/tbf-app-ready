"use client";

import { AlertTriangle, Lock, LogOut, ArrowLeft } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { useRouter } from "next/navigation";

interface SuspensionOverlayProps {
    suspendedUntil: Date | string;
    dashboardPath?: string;
}

export function SuspensionOverlay({ suspendedUntil, dashboardPath = "/referee" }: SuspensionOverlayProps) {
    const router = useRouter();
    const formattedDate = new Date(suspendedUntil).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-zinc-950/80 backdrop-blur-md">
            {/* Back Button */}
            <button
                onClick={() => router.push(dashboardPath)}
                className="absolute top-8 left-8 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/10 backdrop-blur-md group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <span className="font-bold text-sm tracking-tight">Geri Dön</span>
            </button>

            <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-[2.5rem] border border-red-200 dark:border-red-900/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 md:p-12 text-center space-y-8">
                    {/* Icon section */}
                    <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-ping opacity-25" />
                        <div className="relative w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-600/30">
                            <Lock className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    {/* Text section */}
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Hesabınız Askıya Alındı</h2>
                        <div className="h-1.5 w-20 bg-red-600 mx-auto rounded-full" />
                        <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
                            Hesabınız bir yönetici tarafından askıya alınmıştır. Bu süre zarfında <span className="font-bold text-red-600 dark:text-red-400">Uygunluk Formu</span> doldurma ve diğer işlemlere erişiminiz kısıtlanmıştır.
                        </p>
                    </div>

                    {/* Detail box */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800 flex flex-col items-center gap-2">
                        <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Kısıtlama Bitiş Tarihi</span>
                        <span className="text-2xl font-bold text-zinc-900 dark:text-white">{formattedDate}</span>
                    </div>

                    {/* Footer section */}
                    <div className="pt-4 flex flex-col gap-4">
                        <p className="text-sm text-zinc-500 font-medium italic">
                            Bir yanlışlık olduğunu düşünüyorsanız lütfen federasyon yönetimi ile iletişime geçiniz.
                        </p>
                        <div className="flex justify-center">
                            <SignOutButton />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
