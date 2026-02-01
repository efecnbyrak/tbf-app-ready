"use client";

import { useActionState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { register } from "@/app/actions/auth";

interface RegisterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSwitchToLogin: () => void;
}

const initialState: { error?: string; success: boolean; username?: string; errors?: Record<string, string> } = {
    error: undefined,
    success: false,
    username: undefined,
    errors: {}
};

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
    const [state, formAction, isPending] = useActionState(register, initialState);

    useEffect(() => {
        if (state.success && isOpen) {
            alert(`Kayıt başarılı! Kullanıcı Adınız: ${state.username}\nLütfen giriş yapınız.`);
            onClose();
            onSwitchToLogin();
        }
    }, [state, isOpen, onClose, onSwitchToLogin]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Kayıt Ol">
            <form action={formAction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Ad
                        </label>
                        <input
                            type="text"
                            name="firstName"
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 ${state.errors?.firstName ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                            placeholder="Ahmet"
                        />
                        {state.errors?.firstName && <p className="text-red-500 text-xs mt-1">{state.errors.firstName}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            Soyad
                        </label>
                        <input
                            type="text"
                            name="lastName"
                            required
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 ${state.errors?.lastName ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                            placeholder="Yılmaz"
                        />
                        {state.errors?.lastName && <p className="text-red-500 text-xs mt-1">{state.errors.lastName}</p>}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        TC Kimlik No
                    </label>
                    <input
                        type="text"
                        name="tckn"
                        required
                        maxLength={11}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 ${state.errors?.tckn ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                        placeholder="11111111111"
                        onChange={(e) => {
                            e.target.value = e.target.value.replace(/\D/g, '');
                        }}
                    />
                    {state.errors?.tckn && <p className="text-red-500 text-xs mt-1">{state.errors.tckn}</p>}
                    {state.errors?.tckn && <p className="text-red-500 text-xs mt-1">{state.errors.tckn}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Telefon Numarası
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        required
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 ${state.errors?.phone ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                        placeholder="05XXXXXXXXX"
                        maxLength={11}
                    />
                    {state.errors?.phone && <p className="text-red-500 text-xs mt-1">{state.errors.phone}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        E-posta
                    </label>
                    <input
                        type="email"
                        name="email"
                        required
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 ${state.errors?.email ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                        placeholder="ornek@mail.com"
                    />
                    {state.errors?.email && <p className="text-red-500 text-xs mt-1">{state.errors.email}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Şifre
                    </label>
                    <input
                        type="password"
                        name="password"
                        required
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 ${state.errors?.password ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                        placeholder="Şifre giriniz.."
                    />
                    {state.errors?.password && <p className="text-red-500 text-xs mt-1">{state.errors.password}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Göreviniz
                    </label>
                    <select
                        name="roleType"
                        required
                        defaultValue=""
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 outline-none dark:bg-zinc-800 dark:border-zinc-700 bg-white ${state.errors?.roleType ? 'border-red-500 ring-red-200' : 'focus:ring-red-600 focus:border-transparent'}`}
                    >
                        <option value="" disabled>Seçiniz</option>
                        <option value="REFEREE">Hakem</option>
                        <option value="TABLE">Masa Görevlisi</option>
                        <option value="OBSERVER">Gözlemci</option>
                        <option value="HEALTH">Sağlıkçı</option>
                        <option value="STATISTICIAN">İstatistikçi</option>
                    </select>
                    {state.errors?.roleType && <p className="text-red-500 text-xs mt-1">{state.errors.roleType}</p>}
                </div>

                {state?.error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
                        {state.error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-zinc-900 text-white font-semibold py-2 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                    {isPending ? "Kaydediliyor..." : "Kayıt Ol"}
                </button>

                <div className="text-center text-sm text-zinc-500 mt-4">
                    Zaten hesabınız var mı?{" "}
                    <button
                        type="button"
                        onClick={onSwitchToLogin}
                        className="text-red-700 font-medium hover:underline"
                    >
                        Giriş Yap
                    </button>
                </div>
            </form>
        </Modal>
    );
}
