import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { login, verify2FA, ActionState } from "@/app/actions/auth";
import { Loader2 } from "lucide-react";

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
    const [state, formAction, isPending] = useActionState(login, initialState);
    const [verifyCode, setVerifyCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState("");

    // Derived state for showing verification step
    // We check if state.requireVerification came back true
    const showVerify = state.requireVerification && state.userId;

    const router = useRouter();

    useEffect(() => {
        // If login full success (no verify needed or after verify flow if we were using same action - but we aren't)
        if (state.success && state.redirectTo && !state.requireVerification) {
            router.push(state.redirectTo);
            onClose();
        }
    }, [state.success, state.redirectTo, state.requireVerification, router, onClose]);

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setVerifyError("");
        if (!state.userId) return;

        const res = await verify2FA(state.userId, verifyCode);
        setVerifying(false);

        if (res.success && res.redirectTo) {
            router.push(res.redirectTo);
            onClose();
        } else {
            setVerifyError(res.error || "Doğrulama başarısız.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={showVerify ? "Doğrulama Kodu" : "Giriş Yap"}>
            {!showVerify ? (
                <form action={formAction} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            TC Kimlik No
                        </label>
                        <input
                            type="text"
                            name="identifier"
                            required
                            maxLength={11}
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white transition-colors"
                            placeholder="TC Kimlik No"
                            onChange={(e) => {
                                e.target.value = e.target.value.replace(/\D/g, '');
                            }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Şifre
                        </label>
                        <input
                            type="password"
                            name="password"
                            required
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white transition-colors"
                            placeholder="Şifre giriniz.."
                        />
                    </div>

                    {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-red-700 text-white font-semibold py-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 flex justify-center"
                    >
                        {isPending ? <Loader2 className="animate-spin" /> : "Giriş Yap"}
                    </button>

                    <div className="text-center text-sm text-zinc-500 mt-4">
                        Hesabınız yok mu?{" "}
                        <button
                            type="button"
                            onClick={onSwitchToRegister}
                            className="text-red-700 font-medium hover:underline"
                        >
                            Kayıt Ol
                        </button>
                    </div>

                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => alert("Şifrenizi sıfırlamak için lütfen bağlı bulunduğunuz İl Hakem Kurulu veya Federasyon yetkilisi ile iletişime geçiniz.")}
                            className="text-zinc-400 hover:text-red-700 text-xs font-medium transition-colors"
                        >
                            Şifremi Unuttum
                        </button>
                    </div>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
                        Sisteme kayıtlı E-posta adresinize gönderilen 6 haneli doğrulama kodunu giriniz.
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                            Doğrulama Kodu
                        </label>
                        <input
                            type="text"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            required
                            maxLength={6}
                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none bg-white text-zinc-900 text-center text-2xl tracking-widest font-mono"
                            placeholder="123456"
                        />
                    </div>

                    {verifyError && <p className="text-red-500 text-sm">{verifyError}</p>}

                    <button
                        type="submit"
                        disabled={verifying}
                        className="w-full bg-red-700 text-white font-semibold py-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50 flex justify-center"
                    >
                        {verifying ? <Loader2 className="animate-spin" /> : "Doğrula ve Giriş Yap"}
                    </button>
                </form>
            )}
        </Modal>
    );
}
