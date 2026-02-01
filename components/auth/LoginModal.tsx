"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { login } from "@/app/actions/auth";

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToRegister: () => void;
}

const initialState = {
    error: undefined as string | undefined,
    success: false,
};

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
    const [state, formAction, isPending] = useActionState(login, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state.success && state.redirectTo) {
            router.push(state.redirectTo);
        }
    }, [state.success, state.redirectTo, router]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Giriş Yap">
            <form action={formAction} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        TC Kimlik No / Kullanıcı Adı
                    </label>
                    <input
                        type="text"
                        name="identifier"
                        required
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none dark:bg-zinc-800 dark:border-zinc-700"
                        placeholder="TCKN veya Kullanıcı Adı"
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
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none dark:bg-zinc-800 dark:border-zinc-700"
                        placeholder="Şifre giriniz.."
                    />
                </div>

                {state?.error && <p className="text-red-500 text-sm">{state.error}</p>}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-red-700 text-white font-semibold py-2 rounded-lg hover:bg-red-800 transition-colors disabled:opacity-50"
                >
                    {isPending ? "Giriş Yapılıyor..." : "Giriş Yap"}
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
            </form>
        </Modal>
    );
}
