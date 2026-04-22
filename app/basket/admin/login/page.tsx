"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { login, verify2FA } from "@/app/actions/auth";
import Link from "next/link";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [require2FA, setRequire2FA] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [twoFACode, setTwoFACode] = useState("");
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);

        try {
            const result = await login({ success: false }, formData);
            if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            } else if (result?.requireVerification && result?.userId) {
                setRequire2FA(true);
                setUserId(result.userId);
                setIsLoading(false);
            } else if (result?.success && result?.redirectTo) {
                window.location.href = result.redirectTo;
            }
        } catch (err) {
            console.error(err);
            setError("Giriş yapılamadı.");
            setIsLoading(false);
        }
    };

    const handleVerify2FA = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setIsLoading(true);
        setError("");

        try {
            const result = await verify2FA(userId, twoFACode);
            if (result?.success && result?.redirectTo) {
                window.location.href = result.redirectTo;
            } else if (result?.error) {
                setError(result.error);
                setIsLoading(false);
            }
        } catch (err) {
            console.error(err);
            setError("Doğrulama hatası.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-red-700 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-2xl shadow-red-900/50 mb-6 uppercase tracking-widest text-white italic">
                        BKS
                    </div>
                    <h1 className="text-3xl font-bold">Yönetici Girişi</h1>
                    <p className="text-zinc-500 mt-2">Sadece yetkili personel içindir.</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
                    {!require2FA ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input type="hidden" name="adminLogin" value="true" />
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Kullanıcı Adı / E-posta
                                </label>
                                <input
                                    type="text"
                                    name="identifier" // Matches our server action
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                                    placeholder="admin"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">
                                    Şifre
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-600 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/30 border border-red-900/50 text-red-400 text-sm rounded-lg text-center flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Giriş Yapılıyor...
                                    </>
                                ) : (
                                    "Panele Giriş"
                                )}
                            </button>

                            <div className="text-center">
                                <Link
                                    href="/forgot-password"
                                    className="text-zinc-500 hover:text-red-600 text-xs font-medium transition-colors"
                                >
                                    Şifremi Unuttum
                                </Link>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify2FA} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-900/50">
                                    <ShieldCheck className="w-8 h-8 text-red-500" />
                                </div>
                                <h2 className="text-xl font-bold">Doğrulama Kodu</h2>
                                <p className="text-zinc-500 text-sm mt-2">
                                    E-posta adresinize gönderilen 6 haneli kodu giriniz.
                                </p>
                            </div>

                            <div>
                                <input
                                    type="text"
                                    value={twoFACode}
                                    onChange={(e) => setTwoFACode(e.target.value)}
                                    required
                                    maxLength={6}
                                    className="w-full bg-zinc-950 border border-zinc-700 text-white rounded-lg px-4 py-4 text-center text-3xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-red-600 transition-all placeholder:text-zinc-800"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/30 border border-red-900/50 text-red-400 text-sm rounded-lg text-center flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Doğrulanıyor...
                                    </>
                                ) : (
                                    "Kodu Doğrula"
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setRequire2FA(false);
                                    setUserId(null);
                                    setTwoFACode("");
                                    setError("");
                                }}
                                className="w-full text-zinc-500 hover:text-white text-sm transition-colors"
                            >
                                Giriş Ekranına Dön
                            </button>
                        </form>
                    )}
                </div>

                <p className="text-center text-zinc-600 text-sm mt-8">
                    © {new Date().getFullYear()} BKS Yönetim Paneli
                </p>
            </div>
        </div>
    );
}
