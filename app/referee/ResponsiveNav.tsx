"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, Calendar, FileText, Menu, X, LogOut, BookOpen } from "lucide-react";
import { SignOutButton } from "@/components/auth/SignOutButton";

interface ResponsiveNavProps {
    refereeName: string;
    roleType: string;
    basePath?: string;
    titleOverride?: string;
}

export function ResponsiveNav({ refereeName, roleType, basePath = "/referee", titleOverride }: ResponsiveNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === basePath) {
            return pathname === basePath;
        }
        return pathname.startsWith(path);
    };

    const getTitle = () => {
        if (titleOverride) return titleOverride;
        switch (roleType) {
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
                    <Image src="/hakem/defaultHakem.png" alt="TBF Logo" width={32} height={32} className="rounded-full object-cover" />
                    <span className="font-bold text-lg">{title}</span>
                </div>
                <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar (Mobile Slide-in + Desktop Fixed) */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-zinc-900 border-r dark:border-zinc-800 
                transform transition-transform duration-300 ease-in-out 
                md:translate-x-0 md:block shadow-xl md:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full p-6">
                    {/* Desktop Logo */}
                    <div className="hidden md:flex items-center gap-2 mb-8 h-8">
                        <Image src="/hakem/defaultHakem.png" alt="TBF Logo" width={32} height={32} className="rounded-full object-cover" />
                        <span className="font-bold text-xl">{title}</span>
                    </div>

                    {/* Mobile Logo Repeater */}
                    <div className="md:hidden flex items-center gap-2 mb-8 h-8">
                        <span className="font-bold text-xl">Menü</span>
                    </div>

                    {/* Nav Links */}
                    <nav className="flex-1 space-y-1">
                        <Link
                            href={basePath}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(basePath) && pathname === basePath
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                                }`}
                        >
                            <User className="w-5 h-5" />
                            Profilim
                        </Link>
                        <Link
                            href={`${basePath}/availability`}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(`${basePath}/availability`)
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                                }`}
                        >
                            <Calendar className="w-5 h-5" />
                            Uygunluk Formu
                        </Link>
                        <Link
                            href={`${basePath}/assignments`}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(`${basePath}/assignments`)
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                                }`}
                        >
                            <FileText className="w-5 h-5" />
                            Görevlerim
                        </Link>

                        {/* Rule Book - Now for Everyone */}
                        <Link
                            href={`${basePath}/rules`}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${isActive(`${basePath}/rules`)
                                ? "bg-red-700 text-white shadow-md border-l-4 border-red-900"
                                : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                                }`}
                        >
                            <BookOpen className="w-5 h-5" />
                            Kural Kitabı
                        </Link>
                    </nav>

                    <div className="mt-auto pt-6 border-t dark:border-zinc-800">
                        <div className="mb-4 text-xs text-zinc-500 px-1">
                            Giriş yapan: <span className="text-zinc-800 dark:text-zinc-200 font-semibold block text-sm mt-1">{refereeName}</span>
                        </div>
                        <SignOutButton />
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
            )}
        </>
    );
}
