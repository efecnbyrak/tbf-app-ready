
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { Users, Calendar, LayoutDashboard, Settings, LogOut, Menu, X, Briefcase, FileText, Trophy, CheckCircle, Shield, History as LucideHistory, Sun, Moon, Megaphone } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useState as ReactuseState } from "react";

interface AdminLayoutClientProps {
    children: React.ReactNode;
    role?: string;
}

export function AdminLayoutClient({ children, role }: AdminLayoutClientProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = ReactuseState(false);
    const pathname = usePathname();

    useEffect(() => {
        setMounted(true);
    }, []);

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
                    <Image src="/favicon.png" alt="TBF Logo" width={32} height={32} className="rounded" />
                    <span className="font-bold text-lg tracking-tight">TBF Panel</span>
                </div>
                <div className="flex items-center gap-2">
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    )}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Admin Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white 
                transform transition-transform duration-300 ease-in-out 
                md:translate-x-0 md:block shadow-xl md:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-6">
                    {/* Desktop Logo */}
                    <div className="hidden md:flex items-center gap-2 mb-8 h-8">
                        <Image src="/favicon.png" alt="TBF Logo" width={32} height={32} className="rounded" />
                        <span className="font-bold text-xl tracking-tight">TBF Panel</span>
                    </div>

                    <nav className="flex-1 space-y-2 text-sm overflow-y-auto pr-2 custom-scrollbar">
                        <Link
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Genel Bakış
                        </Link>
                        <Link
                            href="/admin/referees"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/referees")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Hakemler
                        </Link>
                        <Link
                            href="/admin/approvals"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/approvals")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <CheckCircle className="w-4 h-4" />
                            Onay Bekleyenler
                        </Link>
                        <Link
                            href="/admin/officials"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/officials")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Briefcase className="w-4 h-4" />
                            Genel Görevliler
                        </Link>
                        <Link
                            href="/admin/availability"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/availability")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Calendar className="w-4 h-4" />
                            Uygunluklar
                        </Link>
                        <Link
                            href="/admin/announcements"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/announcements")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Megaphone className="w-4 h-4" />
                            Duyuru Sistemi
                        </Link>
                        <Link
                            href="/admin/questions"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/questions")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Soru Havuzu
                        </Link>
                        <Link
                            href="/admin/videos"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/videos")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <span className="w-4 h-4 flex items-center justify-center font-bold">▶</span>
                            Eğitim Videoları
                        </Link>
                        <Link
                            href="/admin/rules"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/rules")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <span className="w-4 h-4 flex items-center justify-center font-bold">📖</span>
                            Kural Kitabı
                        </Link>


                        {/* Super Admin Only Link */}
                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/manage-admins"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/manage-admins")
                                    ? "bg-purple-600 text-white shadow-md border-l-4 border-purple-800"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <Shield className="w-4 h-4 text-purple-400" />
                                Admin Yönetici Paneli
                            </Link>
                        )}

                        {role === "SUPER_ADMIN" && (
                            <Link
                                href="/admin/logs"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/logs")
                                    ? "bg-zinc-950 text-white shadow-md border-l-4 border-zinc-700"
                                    : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                    }`}
                            >
                                <LucideHistory className="w-4 h-4 text-zinc-400" />
                                Sistem İşlem Kayıtları
                            </Link>
                        )}

                        <Link
                            href="/admin/settings"
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive("/admin/settings")
                                ? "bg-red-600 text-white shadow-md border-l-4 border-red-800"
                                : "hover:bg-zinc-800/50 text-zinc-400 hover:text-white"
                                }`}
                        >
                            <Settings className="w-4 h-4" />
                            Ayarlar
                        </Link>
                    </nav>

                    <div className="mt-4 px-4 py-3 flex items-center justify-between bg-zinc-800/80 rounded-xl border border-zinc-700/50 group transition-all hover:bg-zinc-800">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest whitespace-nowrap">Görünüm</span>
                            <span className="text-xs font-bold text-zinc-100 group-hover:text-white transition-colors">
                                {theme === "dark" ? "Koyu Tema" : "Açık Tema"}
                            </span>
                        </div>
                        {mounted && (
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="p-2.5 bg-zinc-700 hover:bg-red-600 text-zinc-300 hover:text-white rounded-lg transition-all shadow-inner active:scale-95"
                                title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
                            >
                                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-zinc-800">
                        <button
                            onClick={async () => await logout()}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800 text-red-500 transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            Hesaptan Çıkış Yap
                        </button>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            )}

            {/* Main Content */}
            <main className="flex-1 md:pl-64 p-4 md:p-8 overflow-x-hidden pt-20 md:pt-8">
                <div className="max-w-7xl mx-auto w-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
