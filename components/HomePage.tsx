"use client";

import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import Image from "next/image";

export function HomePage() {
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    const openLogin = () => {
        setIsRegisterOpen(false);
        setIsLoginOpen(true);
    };

    const openRegister = () => {
        setIsLoginOpen(false);
        setIsRegisterOpen(true);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-700 to-zinc-900 text-white relative overflow-hidden">
            {/* Background Decor - Optional */}
            <div className="absolute inset-0 bg-[url('/basketball-bg-pattern.png')] opacity-10 pointer-events-none"></div>

            <main className="z-10 flex flex-col items-center text-center p-8 max-w-2xl w-full bg-black/20 backdrop-blur-sm rounded-3xl border border-white/10 shadow-2xl">
                {/* Placeholder Logo */}
                {/* Logo Container */}
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl mb-8 shadow-xl border border-white/20">
                    <Image
                        src="/download.png"
                        alt="TBF Logo"
                        width={180}
                        height={180}
                        className="w-48 h-auto drop-shadow-lg"
                        priority
                    />
                </div>

                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
                    Basketbol Atama Sistemi
                </h1>
                <p className="text-lg md:text-xl text-zinc-200 mb-10 max-w-lg mx-auto">
                    Türkiye Basketbol Federasyonu Atama ve Uygunluk Bildirim Portalı
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                    <button
                        onClick={openLogin}
                        className="w-full py-4 px-6 bg-white text-red-700 font-bold text-lg rounded-xl shadow-lg hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
                    >
                        Giriş Yap
                    </button>
                    <button
                        onClick={openRegister}
                        className="w-full py-4 px-6 bg-transparent border-2 border-white text-white font-bold text-lg rounded-xl hover:bg-white/10 transform hover:scale-105 transition-all duration-200"
                    >
                        Kayıt Ol
                    </button>
                </div>
            </main>

            <footer className="absolute bottom-4 text-zinc-400 text-sm">
                © {new Date().getFullYear()} Türkiye Basketbol Federasyonu. Tüm hakları saklıdır.
            </footer>

            {/* Modals */}
            <LoginModal
                isOpen={isLoginOpen}
                onClose={() => setIsLoginOpen(false)}
                onSwitchToRegister={openRegister}
            />
            <RegisterModal
                isOpen={isRegisterOpen}
                onClose={() => setIsRegisterOpen(false)}
                onSwitchToLogin={openLogin}
            />
        </div>
    );
}
