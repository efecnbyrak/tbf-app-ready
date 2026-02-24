
"use client";

import { useActionState, useEffect, useRef } from "react";
import { createAdmin, ActionState } from "@/app/actions/auth";
import { Loader2, UserPlus } from "lucide-react";

const initialState: ActionState = {
    success: false,
    error: undefined
};

export function CreateAdminForm() {
    const [state, formAction, isPending] = useActionState(createAdmin, initialState);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state.success) {
            formRef.current?.reset();
        }
    }, [state.success]);

    return (
        <form action={formAction} ref={formRef} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    TC Kimlik No
                </label>
                <input
                    type="text"
                    name="tckn"
                    required
                    maxLength={11}
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all"
                    placeholder="11 haneli TCKN"
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
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all"
                    placeholder="••••••••"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Yetki Seviyesi
                </label>
                <select
                    name="role"
                    required
                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-red-600 outline-none transition-all"
                >
                    <option value="ADMIN">Yönetici (Admin)</option>
                    <option value="SUPER_ADMIN">Süper Yönetici (Super Admin)</option>
                </select>
            </div>

            {state?.error && (
                <p className="text-red-500 text-sm font-medium">{state.error}</p>
            )}

            {state?.success && state?.message && (
                <p className="text-green-600 text-sm font-medium">{state.message}</p>
            )}

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
            >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        <UserPlus className="w-5 h-5" />
                        Admin Oluştur
                    </>
                )}
            </button>
        </form>
    );
}
