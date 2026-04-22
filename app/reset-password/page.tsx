"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword } from "@/app/actions/auth";
import { Shield, Lock, CheckCircle2, AlertCircle, ChevronRight, Layout } from "lucide-react";

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Şifre en az 6 karakter olmalıdır.");
            return;
        }

        if (password !== passwordConfirm) {
            setError("Şifreler eşleşmiyor.");
            return;
        }

        const formData = new FormData();
        formData.append("token", token || "");
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);

        startTransition(async () => {
            const res = await resetPassword({ success: false }, formData);
            if (res.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/");
                }, 3000);
            } else {
                setError(res.error || "Bir hata oluştu.");
            }
        });
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">Geçersiz Bağlantı</h1>
                    <p className="text-zinc-500 text-sm mb-6">Şifre sıfırlama bağlantısı geçersiz veya eksik.</p>
                    <button onClick={() => router.push("/")} className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-xl font-bold">Giriş Sayfasına Dön</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white dark:bg-zinc-900 p-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-zinc-200 dark:border-zinc-800 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/5 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-600/5 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-20 h-20 bg-red-600 rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-red-600/20">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-black text-center mb-2 uppercase tracking-tighter text-zinc-900 dark:text-white">Şifre Sıfırlama</h1>
                    <p className="text-zinc-500 text-center text-sm mb-10">Lütfen hesabınız için yeni ve güçlü bir şifre belirleyin.</p>

                    {success ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-800/50 p-6 rounded-2xl flex flex-col items-center text-center">
                                <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                                <h3 className="text-emerald-900 dark:text-emerald-100 font-bold uppercase tracking-tight">Başarılı!</h3>
                                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-1">Şifreniz güncellendi. Giriş sayfasına yönlendiriliyorsunuz...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Yeni Şifre</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-transparent focus:border-red-600 outline-none transition-all text-sm font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Şifre Tekrar</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        type="password"
                                        required
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-transparent focus:border-red-600 outline-none transition-all text-sm font-bold"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
                            >
                                {isPending ? "GÜNCELLENİYOR..." : "ŞİFREYİ KAYDET"}
                                {!isPending && <ChevronRight className="w-4 h-4" />}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
