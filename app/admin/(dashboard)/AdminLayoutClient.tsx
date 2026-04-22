"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Users, Calendar, LayoutDashboard, Settings, LogOut, Menu, X, Briefcase, History as LucideHistory, Megaphone, ClipboardList, CheckCircle, User, PlayCircle, BookOpen, Trophy, Bell } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface AdminLayoutClientProps {
    children: React.ReactNode;
    role?: string;
    imageUrl?: string | null;
}

export function AdminLayoutClient({ children, role, imageUrl }: AdminLayoutClientProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewMatches, setHasNewMatches] = useState(false);
    const pathname = usePathname();

    // Notification check
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await fetch("/api/matches/notification");
                const data = await res.json();
                setHasNewMatches(data.hasNew);
            } catch (e) { }
        };
        checkNotifications();
        const interval = setInterval(checkNotifications, 120 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pathname === "/admin/matches") {
            setHasNewMatches(false);
        }
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === "/admin") {
            return pathname === "/admin";
        }
        return pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-zinc-900 text-white border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-50 h-16 shadow-lg">
                <div className="flex items-center gap-2">
                    <Image src={imageUrl || "/hakem/defaultHakem.png"} alt="BKS Logo" width={32} height={32} className="rounded-full object-cover aspect-square" priority />
                    <span className="font-bold text-lg tracking-tight">BKS Panel</span>
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Admin Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 text-white 
                transform transition-transform duration-300 ease-in-out 
                md:translate-x-0 md:block shadow-xl md:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-4">
                    {/* Desktop Logo */}
                    <div className="hidden md:flex items-center gap-2 mb-6 h-8">
                        <Image src={imageUrl || "/hakem/defaultHakem.png"} alt="BKS Logo" width={32} height={32} className="rounded-full object-cover aspect-square" priority />
                        <span className="font-bold text-xl tracking-tight">BKS Panel</span>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto pr-2 modern-scrollbar pb-10">
                        <Link
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Genel Bakış
                        </Link>

                        <Link
                            href="/admin/profile"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/profile")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <User className="w-4 h-4" />
                            Profilim & Ayarlar
                        </Link>

                        <div className="pt-3 pb-1 px-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Yönetim</span>
                        </div>

                        <Link
                            href="/admin/referees"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/referees")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Hakemler
                        </Link>

                        <Link
                            href="/admin/officials"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/officials")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            Genel Görevliler
                        </Link>

                        <Link
                            href="/admin/all-availabilities"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/all-availabilities")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Uygunluklar
                        </Link>

                        {(role === "OBSERVER" || role === "ADMIN") && (
                            <Link
                                href="/referee/reports/new"
                                onClick={() => setIsOpen(false)}
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${pathname === "/referee/reports/new"
                                    ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <ClipboardList className="w-4 h-4 text-orange-400" />
                                Rapor Girişi
                            </Link>
                        )}





                        <Link
                            href="/admin/observer-reports"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/observer-reports")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <ClipboardList className="w-4 h-4 text-orange-400" />
                            Gözlemci Raporları
                        </Link>

                        <Link
                            href="/admin/announcements"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/announcements")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Megaphone className="w-4 h-4" />
                            Duyurular
                        </Link>

                        <Link
                            href="/admin/approvals"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/approvals")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Onaylar
                        </Link>

                        <Link
                            href="/admin/bag"
                            onClick={() => setIsOpen(false)}
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/bag")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Briefcase className="w-4 h-4 text-red-500" />
                            Hakem Çantası
                        </Link>


                        <div className="pt-3 pb-1 px-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sistem</span>
                        </div>

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/logs"
                                onClick={() => setIsOpen(false)}
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[15px] ${isActive("/admin/logs")
                                    ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <LucideHistory className="w-4 h-4" />
                                İşlem Günlükleri
                            </Link>
                        )}

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/settings"
                                onClick={() => setIsOpen(false)}
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[15px] ${isActive("/admin/settings")
                                    ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Settings className="w-4 h-4" />
                                Ayarlar
                            </Link>
                        )}
                    </nav>

                    <div className="mt-auto pt-2 border-t border-zinc-800 shrink-0 px-2 lg:px-0">
                        <button
                            onClick={async () => await logout()}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-zinc-800 text-red-500 transition-colors text-[15px]"
                        >
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            )}

            {/* Main Content */}
            <main className="flex-1 md:pl-80 min-h-screen flex flex-col relative min-w-0 overflow-x-hidden">
                <div className="flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-24 pt-24 md:pt-16 w-full transition-all duration-500 min-w-0">
                    <div className="max-w-[1400px] mx-auto w-full min-w-0">
                        {children}
                    </div>
                </div>

                {/* Dashboard Footer */}
                <footer className="p-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-xs mt-auto">
                    <div className="flex items-center justify-center gap-4 italic font-bold">
                        <span>© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
