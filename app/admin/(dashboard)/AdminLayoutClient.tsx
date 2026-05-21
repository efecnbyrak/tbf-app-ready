"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Users, Calendar, LayoutDashboard, Settings, LogOut, Briefcase, History as LucideHistory, Megaphone, ClipboardList, CheckCircle, User, Trophy, Bell, TableProperties, Banknote, MoreHorizontal, X } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface AdminLayoutClientProps {
    children: React.ReactNode;
    role?: string;
    imageUrl?: string | null;
}

export function AdminLayoutClient({ children, role, imageUrl }: AdminLayoutClientProps) {
    const [isMoreOpen, setIsMoreOpen] = useState(false);
    const [hasNewMatches, setHasNewMatches] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await fetch("/api/matches/notification");
                const data = await res.json();
                setHasNewMatches(data.hasNew);
            } catch (e) { }
        };
        checkNotifications();
        const interval = setInterval(checkNotifications, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (pathname === "/admin/matches") setHasNewMatches(false);
    }, [pathname]);

    // iOS scroll lock for drawer
    useEffect(() => {
        if (typeof window === "undefined") return;
        const isMobile = window.innerWidth < 768;
        if (isMoreOpen && isMobile) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = "hidden";
            return () => { document.body.style.overflow = prev; };
        }
    }, [isMoreOpen]);

    // Close drawer on navigation
    useEffect(() => {
        setIsMoreOpen(false);
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === "/admin") return pathname === "/admin";
        return pathname.startsWith(path);
    };

    const bottomItem = (active: boolean) =>
        `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative transition-colors ${active ? "text-red-500" : "text-zinc-500"}`;

    const drawerLink = (active: boolean) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-[15px] ${active ? "bg-red-700 text-white shadow-md" : "hover:bg-zinc-800/50 text-zinc-300 hover:text-white"}`;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <div className="md:hidden bg-zinc-900 text-white border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-50 h-16 shadow-lg">
                <div className="flex items-center gap-2">
                    <Image src={imageUrl || "/hakem/defaultHakem.png"} alt="BKS Logo" width={32} height={32} className="rounded-full object-cover aspect-square" priority />
                    <span className="font-bold text-lg tracking-tight">BKS Panel</span>
                </div>
                {hasNewMatches && (
                    <div className="relative animate-bounce">
                        <Bell className="w-5 h-5 text-red-500 fill-red-500" />
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-zinc-900"></span>
                    </div>
                )}
            </div>

            {/* Admin Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:block shadow-xl md:shadow-none -translate-x-full">
                <div className="flex flex-col h-full p-4">
                    {/* Desktop Logo */}
                    <div className="hidden md:flex items-center gap-2 mb-6 h-8">
                        <Image src={imageUrl || "/hakem/defaultHakem.png"} alt="BKS Logo" width={32} height={32} className="rounded-full object-cover aspect-square" priority />
                        <span className="font-bold text-xl tracking-tight">BKS Panel</span>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto pr-2 modern-scrollbar pb-10">
                        <Link
                            href="/admin"
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Genel Bakış
                        </Link>

                        <div className="pt-3 pb-1 px-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Yönetim</span>
                        </div>

                        <Link
                            href="/admin/referees"
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
                            prefetch={false}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/bag")
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Briefcase className="w-4 h-4 text-red-500" />
                            Hakem Çantası
                        </Link>

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/atamalar"
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/atamalar")
                                    ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <TableProperties className="w-4 h-4 text-orange-400" />
                                Atamalar
                            </Link>
                        )}

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/user-matches"
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/user-matches")
                                    ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Trophy className="w-4 h-4 text-orange-400" />
                                Maçlar
                            </Link>
                        )}

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/payments"
                                prefetch={false}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/payments")
                                    ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Banknote className="w-4 h-4 text-emerald-400" />
                                Ödemeler
                            </Link>
                        )}

                        <div className="pt-3 pb-1 px-4">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Sistem</span>
                        </div>

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/logs"
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

            {/* Mobile Bottom Nav Bar */}
            <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-zinc-900 border-t border-zinc-800">
                <div className="flex items-stretch h-16">
                    <Link href="/admin" prefetch={false} className={bottomItem(isActive("/admin") && pathname === "/admin")}>
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Dashboard</span>
                        {isActive("/admin") && pathname === "/admin" && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-red-500" />}
                    </Link>

                    <Link href="/admin/referees" prefetch={false} className={bottomItem(isActive("/admin/referees"))}>
                        <Users className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Hakemler</span>
                        {isActive("/admin/referees") && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-red-500" />}
                    </Link>

                    <Link href="/admin/approvals" prefetch={false} className={bottomItem(isActive("/admin/approvals"))}>
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Onaylar</span>
                        {isActive("/admin/approvals") && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-red-500" />}
                    </Link>

                    <Link href="/admin/announcements" prefetch={false} className={bottomItem(isActive("/admin/announcements"))}>
                        <Megaphone className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Duyurular</span>
                        {isActive("/admin/announcements") && <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-red-500" />}
                    </Link>

                    <button onClick={() => setIsMoreOpen(true)} className={bottomItem(false)}>
                        <MoreHorizontal className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Diğer</span>
                    </button>
                </div>
            </nav>

            {/* Drawer Overlay */}
            {isMoreOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm" onClick={() => setIsMoreOpen(false)} />
            )}

            {/* Bottom Drawer */}
            <div className={`fixed inset-x-0 bottom-0 z-50 md:hidden bg-zinc-900 border-t border-zinc-800 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out ${isMoreOpen ? "translate-y-0" : "translate-y-full"}`}>
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-zinc-600 rounded-full" />
                </div>
                <div className="flex items-center justify-between px-5 pb-3">
                    <span className="text-sm font-bold text-zinc-300">Diğer Sayfalar</span>
                    <button onClick={() => setIsMoreOpen(false)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-4 pb-8 space-y-1 overflow-y-auto max-h-[60vh]">
                    <Link href="/admin/officials" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/officials"))}>
                        <Briefcase className="w-4 h-4" />
                        Genel Görevliler
                    </Link>

                    <Link href="/admin/all-availabilities" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/all-availabilities"))}>
                        <Calendar className="w-4 h-4 text-blue-400" />
                        Uygunluklar
                    </Link>

                    <Link href="/admin/observer-reports" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/observer-reports"))}>
                        <ClipboardList className="w-4 h-4 text-orange-400" />
                        Gözlemci Raporları
                    </Link>

                    <Link href="/admin/bag" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/bag"))}>
                        <Briefcase className="w-4 h-4 text-red-500" />
                        Hakem Çantası
                    </Link>

                    {(role === "OBSERVER" || role === "ADMIN") && (
                        <Link href="/referee/reports/new" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(pathname === "/referee/reports/new")}>
                            <ClipboardList className="w-4 h-4 text-orange-400" />
                            Rapor Girişi
                        </Link>
                    )}

                    {role === "SUPER_ADMIN" && (
                        <>
                            <Link href="/admin/atamalar" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/atamalar"))}>
                                <TableProperties className="w-4 h-4 text-orange-400" />
                                Atamalar
                            </Link>
                            <Link href="/admin/user-matches" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/user-matches"))}>
                                <Trophy className="w-4 h-4 text-orange-400" />
                                Maçlar
                            </Link>
                            <Link href="/admin/payments" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/payments"))}>
                                <Banknote className="w-4 h-4 text-emerald-400" />
                                Ödemeler
                            </Link>
                            <Link href="/admin/logs" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/logs"))}>
                                <LucideHistory className="w-4 h-4" />
                                İşlem Günlükleri
                            </Link>
                            <Link href="/admin/settings" onClick={() => setIsMoreOpen(false)} prefetch={false} className={drawerLink(isActive("/admin/settings"))}>
                                <Settings className="w-4 h-4" />
                                Ayarlar
                            </Link>
                        </>
                    )}

                    <div className="pt-2 border-t border-zinc-800">
                        <button
                            onClick={async () => await logout()}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-zinc-800 text-red-500 transition-colors text-[15px] font-medium"
                        >
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 md:pl-80 min-h-screen flex flex-col relative min-w-0 overflow-x-hidden">
                <div className="flex-1 p-4 sm:p-6 md:p-10 lg:p-16 xl:p-24 pt-24 md:pt-16 pb-20 md:pb-0 w-full transition-all duration-500 min-w-0">
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
