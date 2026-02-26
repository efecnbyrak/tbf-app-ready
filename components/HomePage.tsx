"use client";

import { useState } from "react";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import Image from "next/image";
import Link from "next/link";

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
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-700 to-zinc-950 text-white relative overflow-x-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[url('/basketball-bg-pattern.png')] opacity-10 pointer-events-none"></div>

            <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 z-10 py-16 md:py-24">
                <div className="flex flex-col items-center text-center max-w-2xl w-full bg-black/20 backdrop-blur-md p-6 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-500">
                    {/* Logo Container */}
                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl mb-8 shadow-xl border border-white/20 transform hover:scale-105 transition-transform duration-300">
                        <Image
                            src="/download.png"
                            alt="TBF Logo"
                            width={180}
                            height={180}
                            className="w-32 md:w-48 h-auto drop-shadow-lg"
                            priority
                        />
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 italic">
                        Atama Sistemi
                    </h1>
                    <p className="text-base md:text-xl text-zinc-200 mb-10 max-w-lg mx-auto font-medium">
                        Türkiye Basketbol Federasyonu <br className="hidden md:block" />
                        Atama ve Uygunluk Bildirim Portalı
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                        <button
                            onClick={openLogin}
                            className="w-full py-4 px-6 bg-white text-red-700 font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl hover:bg-zinc-100 transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Giriş Yap
                        </button>
                        <button
                            onClick={openRegister}
                            className="w-full py-4 px-6 bg-transparent border-2 border-zinc-100/50 text-zinc-100 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/10 transform hover:-translate-y-1 transition-all duration-200"
                        >
                            Kayıt Ol
                        </button>
                    </div>
                </div>
            </main>

            <footer className="w-full p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-zinc-400 text-[10px] md:text-xs z-20 border-t border-white/5 bg-black/10 backdrop-blur-sm">
                <div className="font-bold tracking-widest uppercase italic">
                    © {new Date().getFullYear()} Türkiye Basketbol Federasyonu
                </div>
                <div className="flex items-center gap-6 font-black uppercase tracking-widest">
                    <Link href="/kvkk" target="_blank" className="hover:text-white transition-colors">KVKK Aydınlatma Metni</Link>
                    <span className="text-zinc-700 hidden md:block">|</span>
                    <span className="text-zinc-500 italic lowercase tracking-normal font-medium">v1.2.0-stable</span>
                </div>
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
