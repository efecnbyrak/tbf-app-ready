"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getUserSecurityQuestion, resetPasswordWithSecurityQuestion, resetPasswordWithRecoveryCode } from "@/app/actions/auth";
import { Shield, Key, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Fingerprint } from "lucide-react";
import Link from "next/link";

type Method = "NONE" | "RECOVERY_CODE" | "SECURITY_QUESTION";
type Step = "CHOOSE" | "IDENTIFY_SQ" | "SECURITY_QUESTION" | "RECOVERY_CODE_FORM" | "SUCCESS";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>("CHOOSE");
    
    // Shared State
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Feature Specific State
    const [recoveryCode, setRecoveryCode] = useState("");
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");

    const handleIdentifySQ = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        
        const res = await getUserSecurityQuestion(identifier);
        
        if (res.success && res.question) {
            setQuestion(res.question);
            setStep("SECURITY_QUESTION");
        } else {
            setError(res.error || "Güvenlik sorusu alınamadı.");
        }
        setIsLoading(false);
    };

    const handleSQSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("identifier", identifier);
        formData.append("answer", answer);
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);

        const res = await resetPasswordWithSecurityQuestion({ success: false }, formData);
        if (res.success) {
            setStep("SUCCESS");
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } else {
            setError(res.error || "Şifre güncellenemedi.");
        }
        setIsLoading(false);
    };

    const handleRofSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append("identifier", identifier);
        formData.append("recoveryCode", recoveryCode);
        formData.append("password", password);
        formData.append("passwordConfirm", passwordConfirm);

        const res = await resetPasswordWithRecoveryCode({ success: false }, formData);
        if (res.success) {
            setStep("SUCCESS");
            setTimeout(() => {
                router.push("/");
            }, 3000);
        } else {
            setError(res.error || "Şifre güncellenemedi.");
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-700 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-red-900/40 mb-6 transition-all group hover:scale-105">
                        <Key className="w-8 h-8 text-white group-hover:rotate-12 transition-transform" />
                    </div>
                    <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Şifremi Unuttum</h1>
                    <p className="text-zinc-500 text-sm mt-2">Hesabınızı kurtarmak için bir yöntem seçin.</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    
                    {step === "CHOOSE" && (
                        <div className="space-y-4">
                            <button
                                onClick={() => setStep("RECOVERY_CODE_FORM")}
                                className="w-full relative overflow-hidden bg-zinc-950 border-2 border-red-900/50 hover:border-red-600 rounded-2xl p-6 transition-all group flex flex-col items-center gap-3"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <Fingerprint className="w-8 h-8 text-red-500" />
                                <div className="text-center">
                                    <h3 className="text-white font-bold text-lg">Kurtarma Kodu İle Sıfırla</h3>
                                    <p className="text-red-500/80 text-xs mt-1 font-semibold tracking-widest uppercase">En Güvenli & Önerilen</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep("IDENTIFY_SQ")}
                                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all group flex flex-col items-center gap-3"
                            >
                                <Shield className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" />
                                <div className="text-center">
                                    <h3 className="text-zinc-400 group-hover:text-white font-bold text-lg transition-colors">Güvenlik Sorusu İle Sıfırla</h3>
                                    <p className="text-zinc-600 text-xs mt-1">Klasik Kurtarma</p>
                                </div>
                            </button>
                        </div>
                    )}

                    {step === "RECOVERY_CODE_FORM" && (
                        <form onSubmit={handleRofSubmit} className="space-y-5">
                            <div className="text-center mb-6 border-b border-zinc-800 pb-4">
                                <h2 className="text-white font-bold text-lg">Kurtarma Kodu</h2>
                                <p className="text-red-500 text-xs mt-1">Lütfen 8 haneli kurtarma kodunuzu girin.</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3 mb-4">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Kullanıcı Adı veya E-posta</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="Hesabınızı tanımlayın"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">8 Haneli Kurtarma Kodu</label>
                                <input
                                    type="text"
                                    required
                                    value={recoveryCode}
                                    onChange={(e) => setRecoveryCode(e.target.value)}
                                    className="w-full bg-zinc-950 border border-red-900/40 text-red-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all tracking-[0.2em] uppercase font-black placeholder:font-normal placeholder:lowercase placeholder:tracking-normal"
                                    placeholder="Örn: 8F3K-92LD"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre Tekrar</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordConfirm}
                                    onChange={(e) => setPasswordConfirm(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Şifreyi Güncelle"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("CHOOSE")}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest"
                            >
                                Geri Dön
                            </button>
                        </form>
                    )}

                    {step === "IDENTIFY_SQ" && (
                        <form onSubmit={handleIdentifySQ} className="space-y-6">
                            <div className="text-center mb-6 border-b border-zinc-800 pb-4">
                                <h2 className="text-white font-bold text-lg">Güvenlik Sorusu</h2>
                                <p className="text-zinc-500 text-xs mt-1">Önce hesabınızı bulalım.</p>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3 mb-4">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Kullanıcı Adı veya E-posta</label>
                                <input
                                    type="text"
                                    required
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-4 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                    placeholder="Hesabınızı tanımlayın"
                                    autoFocus
                                />
                            </div>
                            
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Devam Et"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("CHOOSE")}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest mt-4"
                            >
                                Geri Dön
                            </button>
                        </form>
                    )}

                    {step === "SECURITY_QUESTION" && (
                        <form onSubmit={handleSQSubmit} className="space-y-5">
                            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl">
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Güvenlik Sorunuz</label>
                                <div className="text-white font-bold text-sm italic">"{question}"</div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-500 text-xs rounded-xl flex items-center gap-3 font-bold">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Cevabınız</label>
                                    <input
                                        type="text"
                                        required
                                        value={answer}
                                        onChange={(e) => setAnswer(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        placeholder="Cevabınızı girin"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-1">Yeni Şifre Tekrar</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordConfirm}
                                        onChange={(e) => setPasswordConfirm(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {isLoading ? <Loader2 className="animate-spin" /> : "Şifreyi Güncelle"}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("CHOOSE")}
                                className="w-full text-zinc-600 hover:text-zinc-400 text-xs font-bold transition-colors uppercase tracking-widest"
                            >
                                İptal Et
                            </button>
                        </form>
                    )}

                    {step === "SUCCESS" && (
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 bg-emerald-900/20 border border-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-xl">Şifre Başarıyla Değiştirildi</h3>
                                <p className="text-zinc-500 text-sm mt-2">
                                    Yeni şifrenizle giriş yapabilirsiniz. Yönlendiriliyorsunuz...
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-zinc-600 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
                        <ArrowLeft className="w-3 h-3" /> Giriş Sayfasına Dön
                    </Link>
                </div>
            </div>
        </div>
    );
}

