"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/actions/auth";
import Image from "next/image";

export default function AdminLoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
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
            } else if (result?.success && result?.redirectTo) {
                router.push(result.redirectTo);
            }
        } catch (err) {
            console.error(err);
            setError("Giriş yapılamadı.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-red-700 rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-2xl shadow-red-900/50 mb-6">
                        TBF
                    </div>
                    <h1 className="text-3xl font-bold">Yönetici Girişi</h1>
                    <p className="text-zinc-500 mt-2">Sadece yetkili personel içindir.</p>
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input type="hidden" name="adminLogin" value="true" />
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">
                                Kullanıcı Adı veya TCKN
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
                            <div className="p-3 bg-red-900/30 border border-red-900/50 text-red-400 text-sm rounded-lg text-center">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                        >
                            {isLoading ? "Giriş Yapılıyor..." : "Panele Giriş"}
                        </button>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => alert("Şifrenizi sıfırlamak için lütfen sistem yöneticisi ile iletişime geçiniz.")}
                                className="text-zinc-500 hover:text-red-600 text-xs font-medium transition-colors"
                            >
                                Şifremi Unuttum
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-zinc-600 text-sm mt-8">
                    © {new Date().getFullYear()} TBF Hakem Yönetim Paneli
                </p>
            </div>
        </div>
    );
}
