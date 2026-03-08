"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { login, verify2FA, requestPasswordReset, ActionState } from "@/app/actions/auth";
import { Loader2, User, Lock, ChevronRight, X, AlertCircle, CheckCircle2, ShieldQuestion } from "lucide-react";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister: () => void;
}

const initialState: ActionState = {
    error: undefined,
    success: false,
    requireVerification: false,
    userId: undefined
};

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
    const [loginState, formAction, isLoginPending] = useActionState(login, initialState);
    const [verifyCode, setVerifyCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");

    const [showReset, setShowReset] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetSuccess, setResetSuccess] = useState<string | null>(null);
    const [isResetPending, startTransition] = useTransition();

    // Derived state for showing verification step
    const showVerify = loginState.requireVerification && loginState.userId;

    const router = useRouter();

    useEffect(() => {
        if (loginState.success && loginState.redirectTo && !loginState.requireVerification) {
            router.push(loginState.redirectTo);
            onClose();
        }
    }, [loginState.success, loginState.redirectTo, loginState.requireVerification, router, onClose]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setVerifyError("");
        if (!loginState.userId) return;

        const res = await verify2FA(loginState.userId, verifyCode);
        setVerifying(false);

        if (res.success && res.redirectTo) {
            router.push(res.redirectTo);
            onClose();
        } else {
            setVerifyError(res.error || "Doğrulama başarısız.");
        }
    };

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetError(null);
        setResetSuccess(null);

        const formData = new FormData(e.currentTarget as HTMLFormElement);
        startTransition(async () => {
            const res = await requestPasswordReset({ success: false }, formData);
            if (res.success) {
                setResetSuccess(res.message || "E-posta gönderildi.");
            } else {
                setResetError(res.error || "Bir hata oluştu.");
            }
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                setShowReset(false);
                setResetSuccess(null);
                setResetError(null);
            }}
            title={showReset ? "Şifre Sıfırlama" : (showVerify ? "Doğrulama Kodu" : "Giriş Yap")}
        >
            {showReset ? (
                <div className="space-y-6">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ShieldQuestion className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Şifre Sıfırlama</h2>
                        <p className="text-zinc-500 text-xs mt-1">Lütfen hesabınıza bağlı TCKN veya kullanıcı adınızı girin.</p>
                    </div>

                    {resetSuccess ? (
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 p-4 rounded-xl flex items-center gap-3 text-emerald-600 text-xs font-bold animate-in slide-in-from-top-2">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                            {resetSuccess}
                        </div>
                    ) : (
                        <form onSubmit={handleResetRequest} className="space-y-4">
                            {resetError && (
                                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-4 rounded-xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {resetError}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest ml-1">Kullanıcı Bilgisi</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                    <input
                                        name="identifier"
                                        required
                                        className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-transparent focus:border-red-600 outline-none transition-all text-sm font-bold placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                                        placeholder="TC Kimlik No"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isResetPending}
                                className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50"
                            >
                                {isResetPending ? "GÖNDERİLİYOR..." : "SIFIRLAMA BAĞLANTISI GÖNDER"}
                            </button>
                        </form>
                    )}

                    <button
                        type="button"
                        onClick={() => setShowReset(false)}
                        className="w-full text-center text-xs font-bold text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        Giriş Sayfasına Dön
                    </button>
                </div>
            ) : !showVerify ? (
                <div className="space-y-6">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 bg-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Hoş Geldiniz</h2>
                        <p className="text-zinc-500 text-xs mt-1">Devam etmek için lütfen giriş bilgilerinizi girin.</p>
                    </div>

                    <form action={formAction} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-500 uppercase tracking-widest ml-1">
                                TC Kimlik No
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    name="identifier"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-transparent focus:border-red-600 outline-none transition-all text-sm font-bold placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                                    placeholder="TC Kimlik No"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-500 uppercase tracking-widest ml-1">
                                Şifre
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border-2 border-zinc-200 dark:border-transparent focus:border-red-600 outline-none transition-all text-sm font-bold placeholder:text-zinc-400 text-zinc-900 dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between px-1">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    className="w-4 h-4 rounded border-2 border-zinc-200 dark:border-zinc-700 text-red-600 focus:ring-red-600 transition-all cursor-pointer"
                                />
                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors">
                                    Beni Hatırla
                                </span>
                            </label>
                        </div>

                        {loginState?.error && (
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/50 p-3 rounded-xl flex items-center gap-2 text-red-600 text-[10px] font-bold animate-in shake-in duration-300">
                                <AlertCircle className="w-4 h-4" />
                                {loginState.error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoginPending}
                            className="group relative w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:opacity-95 transition-all shadow-xl disabled:opacity-50 overflow-hidden"
                        >
                            <div className="relative z-10 flex items-center justify-center gap-2">
                                {isLoginPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "GİRİŞ YAP"}
                                {!isLoginPending && <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                            </div>
                        </button>

                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onSwitchToRegister}
                                className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-[10px] font-black uppercase tracking-wider transition-colors"
                            >
                                Hesabınız yok mu? <span className="text-red-600">Hemen Kayıt Ol</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowReset(true)}
                                className="text-zinc-400 hover:text-red-600 text-[10px] font-black uppercase tracking-wider transition-colors"
                            >
                                Şifremi Unuttum
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <form onSubmit={handleVerify} className="space-y-6 animate-in slide-in-from-right duration-300">
                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl text-[10px] uppercase font-black tracking-tight text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
                        Sisteme kayıtlı E-posta adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 ml-1">
                            Doğrulama Kodu
                        </label>
                        <input
                            type="text"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            required
                            maxLength={6}
                            className="w-full px-4 py-5 border-2 border-zinc-100 dark:border-zinc-800 rounded-[1.5rem] focus:border-red-600 outline-none bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white text-center text-3xl tracking-[1em] font-black font-mono transition-all"
                            placeholder="000000"
                        />
                    </div>

                    {verifyError && (
                        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-lg flex items-center gap-2 text-red-600 text-xs font-bold">
                            <AlertCircle className="w-4 h-4" />
                            {verifyError}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={verifying}
                        className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-black py-4 rounded-xl hover:opacity-90 transition-all shadow-xl disabled:opacity-50 flex justify-center uppercase tracking-widest text-xs"
                    >
                        {verifying ? <Loader2 className="animate-spin" /> : "Doğrula ve Giriş Yap"}
                    </button>
                </form>
            )}
        </Modal>
    );
}
