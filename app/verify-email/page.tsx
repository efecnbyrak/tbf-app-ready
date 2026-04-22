"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Home, Mail } from "lucide-react";
import Link from "next/link";
import { verifyEmailAction } from "@/app/actions/auth";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState("");

    const token = searchParams.get("token");
    const type = searchParams.get("type") as 'register' | 'change';

    useEffect(() => {
        const verify = async () => {
            if (!token || !type) {
                setStatus('error');
                setMessage("Geçersiz doğrulama bağlantısı.");
                return;
            }

            const result = await verifyEmailAction(token, type);

            if (result.success) {
                setStatus('success');
                setMessage(type === 'register'
                    ? "E-posta adresiniz başarıyla doğrulandı! Şimdi yönetici onayından sonra giriş yapabilirsiniz."
                    : "E-posta adresiniz başarıyla güncellendi.");
            } else {
                setStatus('error');
                setMessage(result.error || "Doğrulama işlemi başarısız oldu.");
            }
        };

        verify();
    }, [token, type]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-100 dark:border-zinc-800 p-8 text-center animate-in zoom-in-95 duration-500">

                {status === 'loading' && (
                    <div className="space-y-6 py-8">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-red-600/20 blur-xl rounded-full"></div>
                                <Loader2 className="w-16 h-16 text-red-600 animate-spin relative" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">E-posta Doğrulanıyor</h2>
                        <p className="text-zinc-500 dark:text-zinc-400">Lütfen bekleyin, işleminiz gerçekleştiriliyor...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6 py-8">
                        <div className="flex justify-center">
                            <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full">
                                <CheckCircle2 className="w-16 h-16 text-green-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">İşlem Başarılı!</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{message}</p>
                        <div className="pt-4">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 bg-red-600 text-white rounded-xl px-8 py-3 font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-600/20 active:scale-95"
                            >
                                <Home className="w-4 h-4" />
                                Ana Sayfaya Dön
                            </Link>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6 py-8">
                        <div className="flex justify-center">
                            <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
                                <XCircle className="w-16 h-16 text-red-600" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Hata Oluştu</h2>
                        <p className="text-red-600 dark:text-red-400 font-medium">{message}</p>
                        <div className="pt-4 space-y-3">
                            <Link
                                href="/"
                                className="flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl px-8 py-3 font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95"
                            >
                                <Home className="w-4 h-4" />
                                Ana Sayfaya Dön
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black">
            <header className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 p-2 rounded-lg">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                            Basketbol Koordinasyon Sistemi
                        </h1>
                    </div>
                </div>
            </header>

            <Suspense fallback={
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                </div>
            }>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
