"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, Calendar, Menu, X, Sparkles, LayoutDashboard, Users, Briefcase, CheckCircle, Megaphone, ClipboardList, Shield, PlayCircle, Trophy, BookOpen, Bell } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface ResponsiveNavProps {
    refereeName: string;
    roleType: string;
    basePath?: string;
    titleOverride?: string;
    isAdminObserver?: boolean;
    imageUrl?: string | null;
    canSeeMatches?: boolean;
}

export function ResponsiveNav({ refereeName, roleType, basePath = "/referee", titleOverride, isAdminObserver, imageUrl, canSeeMatches = true }: ResponsiveNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hasNewMatches, setHasNewMatches] = useState(false);
    const [unreadAnnouncements, setUnreadAnnouncements] = useState(0);
    const pathname = usePathname();

    // Check for notifications
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const res = await fetch("/api/matches/notification");
                const data = await res.json();
                setHasNewMatches(data.hasNew);
                
                const annRes = await fetch("/api/announcements/unread");
                const annData = await annRes.json();
                setUnreadAnnouncements(annData.count || 0);
            } catch (e) {
                // Ignore errors
            }
        };

        checkNotifications();
        const interval = setInterval(checkNotifications, 60 * 1000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    // Clear local state if we are ON the matches or announcements page
    useEffect(() => {
        if (pathname.endsWith("/matches")) {
            setHasNewMatches(false);
        }
        if (pathname.endsWith("/announcements")) {
            setUnreadAnnouncements(0);
        }
    }, [pathname]);

    const isActive = (path: string) => {
        if (path === basePath) {
            return pathname === basePath;
        }
        return pathname.startsWith(path);
    };

    const getTitle = () => {
        if (titleOverride) return titleOverride;
        switch (roleType) {
            case "REFEREE":
                return isAdminObserver ? "Hakem" : "Hakem Paneli";
            case "TABLE":
                return "Masa Görevlisi";
            case "OBSERVER":
                return "Gözlemci";
            case "HEALTH":
                return "Sağlıkçı";
            case "STATISTICIAN":
                return "İstatistikçi";
            default:
                return "Hakem Paneli";
        }
    };

    const title = getTitle();

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden bg-white dark:bg-zinc-900 border-b dark:border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-50 h-16">
                <div className="flex items-center gap-2">
                    <Image src={imageUrl || "/hakem/defaultHakem.png"} alt="BKS Logo" width={32} height={32} className="rounded-full object-cover aspect-square" priority />
                    <span className="font-bold text-lg text-zinc-900 dark:text-white">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {hasNewMatches && (
                        <div className="relative animate-bounce">
                            <Bell className="w-5 h-5 text-red-600 fill-red-600" />
                            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white dark:border-zinc-900"></span>
                        </div>
                    )}
                    <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-zinc-900 border-r dark:border-zinc-800 
                transform transition-transform duration-300 ease-in-out 
                md:translate-x-0 md:block shadow-xl md:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-4">
                    {/* Desktop Logo */}
                    <div className="hidden md:flex items-center gap-2 mb-6 h-8">
                        <Image src={imageUrl || "/hakem/defaultHakem.png"} alt="BKS Logo" width={32} height={32} className="rounded-full object-cover aspect-square" priority />
                        <span className="font-bold text-xl text-zinc-900 dark:text-white">{title}</span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 space-y-1 overflow-y-auto pr-2 modern-scrollbar pb-10">
                        {basePath === "/admin" ? (
                            <>
                                <div className="pt-3 pb-1 px-4">
                                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-500 uppercase tracking-[0.2em]">Yönetim Paneli</span>
                                </div>
                                
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin") && pathname === "/admin"
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Genel Bakış
                                </Link>

                                <Link
                                    href="/admin/approvals"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/approvals")
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    Onay Bekleyenler
                                </Link>

                                <Link
                                    href="/admin/announcements"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/announcements")
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <Megaphone className="w-4 h-4 text-purple-500" />
                                    Duyuru Sistemi
                                </Link>

                                <Link
                                    href="/admin/bag"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/bag")
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <Briefcase className="w-4 h-4 text-red-500" />
                                    Hakem Çantası
                                </Link>

                                <Link
                                    href="/admin/all-availabilities"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/all-availabilities")
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    Tüm Uygunluklar
                                </Link>

                                <div className="pt-3 pb-1 px-4">
                                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-500 uppercase tracking-[0.2em]">Kullanıcılar</span>
                                </div>

                                <Link
                                    href="/admin/referees"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/referees")
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
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
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <Users className="w-4 h-4 text-orange-500" />
                                    Görevliler
                                </Link>

                                <Link
                                    href="/admin/observer-reports"
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive("/admin/observer-reports")
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <ClipboardList className="w-4 h-4 text-orange-400" />
                                    Gözlemci Raporları
                                </Link>

                                <div className="pt-6 pb-2 px-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                                    <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em] italic leading-none">Kişisel Erişim</span>
                                </div>
                                <Link
                                    href={roleType === "REFEREE" ? "/referee" : "/general"}
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white scale-[1.02]`}
                                >
                                    <User className="w-4 h-4" />
                                    Profilim Kısmına Geç
                                </Link>
                            </>
                        ) : (
                            <>
                                <div className="pt-3 pb-1 px-4">
                                    <span className="text-[10px] font-black text-zinc-900 dark:text-zinc-500 uppercase tracking-[0.2em]">Kullanıcı Paneli</span>
                                </div>

                                <Link
                                    href={basePath}
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(basePath) && pathname === basePath
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Genel Bakış
                                </Link>

                                <Link
                                    href={`${basePath}/profile`}
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(`${basePath}/profile`)
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <User className="w-4 h-4" />
                                    Profilim
                                </Link>

                                <Link
                                    href={`${basePath}/availability`}
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(`${basePath}/availability`)
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Uygunluk Formum
                                </Link>

                                {canSeeMatches && (
                                    <Link
                                        href={`${basePath}/matches`}
                                        onClick={() => setIsOpen(false)}
                                        prefetch={false}
                                        className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(`${basePath}/matches`)
                                            ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Trophy className="w-4 h-4 text-amber-500" />
                                            Maçlarım
                                        </div>
                                        {hasNewMatches && (
                                            <div className="relative">
                                                <Bell className={`w-4 h-4 ${isActive(`${basePath}/matches`) ? "text-white fill-white" : "text-red-600 fill-red-600 animate-pulse"}`} />
                                                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full border border-white dark:border-zinc-900"></span>
                                            </div>
                                        )}
                                    </Link>
                                )}

                                {!isAdminObserver && (
                                    <Link
                                        href={`${basePath}/bag`}
                                        onClick={() => setIsOpen(false)}
                                        prefetch={false}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(`${basePath}/bag`)
                                            ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                            }`}
                                    >
                                        <Briefcase className="w-4 h-4 text-red-500" />
                                        Hakem Çantası
                                    </Link>
                                )}

                                <Link
                                    href={`${basePath}/announcements`}
                                    onClick={() => setIsOpen(false)}
                                    prefetch={false}
                                    className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(`${basePath}/announcements`)
                                        ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Megaphone className="w-4 h-4 text-purple-500" />
                                        Duyurular
                                    </div>
                                    {unreadAnnouncements > 0 && (
                                        <div className="relative">
                                            <Bell className={`w-4 h-4 ${isActive(`${basePath}/announcements`) ? "text-white fill-white" : "text-purple-600 fill-purple-600 animate-pulse"}`} />
                                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-600 rounded-full border border-white dark:border-zinc-900"></span>
                                        </div>
                                    )}
                                </Link>

                                {((roleType === "OBSERVER" || isAdminObserver) && roleType !== "REFEREE") && (
                                    <Link
                                        href={`${basePath}/reports/new`}
                                        onClick={() => setIsOpen(false)}
                                        prefetch={false}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] ${isActive(`${basePath}/reports/new`)
                                            ? "bg-red-700 text-white shadow-md border-l-4 border-red-900 scale-[1.02]"
                                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:translate-x-1"
                                            }`}
                                    >
                                        <ClipboardList className="w-4 h-4 text-orange-500" />
                                        Rapor Girişi
                                    </Link>
                                )}

                                {isAdminObserver && (
                                    <>
                                        <div className="pt-6 pb-2 px-4 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                                            <span className="text-[11px] font-black text-red-600 uppercase tracking-[0.2em] italic leading-none">Yönetim Bağlantısı</span>
                                        </div>
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsOpen(false)}
                                            prefetch={false}
                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-[16px] bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40`}
                                        >
                                            <LayoutDashboard className="w-4 h-4" />
                                            Yönetim Merkezine Geç
                                        </Link>
                                    </>
                                )}
                            </>
                        )}
                    </nav>

                    <div className="mt-auto pt-2 border-t dark:border-zinc-800 shrink-0">
                        <div className="mb-2 text-[11px] text-zinc-500 px-2 truncate leading-none flex items-center justify-between">
                            <span className="text-zinc-800 dark:text-zinc-200 font-bold">{refereeName}</span>
                            <span className="text-[9px] text-zinc-400 italic">© 2026 - Tüm Hakları Saklıdır</span>
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </aside>
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            )}
        </>
    );
}
