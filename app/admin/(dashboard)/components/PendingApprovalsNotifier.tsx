"use client";

import { useState, useEffect } from "react";
import { Bell, X, ArrowRight, UserPlus } from "lucide-react";
import Link from "next/link";

interface PendingApprovalsNotifierProps {
    count: number;
}

export function PendingApprovalsNotifier({ count }: PendingApprovalsNotifierProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Show pop-up only if there are pending users and it hasn't been dismissed recently
        const dismissedStr = localStorage.getItem("pendingApprovalsDismissedAt");
        let shouldShow = true;

        if (dismissedStr) {
            const dismissedAt = new Date(dismissedStr).getTime();
            const now = new Date().getTime();
            const twelveHours = 12 * 60 * 60 * 1000;
            if (now - dismissedAt < twelveHours) {
                shouldShow = false; // Don't annoy the user if they dismissed it < 12h ago
            }
        }

        if (count > 0 && shouldShow) {
            // Slight delay so the page loads first
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [count]);

    const handleDismiss = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsVisible(false);
        localStorage.setItem("pendingApprovalsDismissedAt", new Date().toISOString());
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900/50 shadow-2xl rounded-2xl p-5 flex items-start gap-4 max-w-sm relative group overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -z-10 rounded-full" />

                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-xl flex items-center justify-center shrink-0 shadow-sm relative">
                    <Bell className="w-6 h-6 text-red-600 animate-[ring_3s_ease-in-out_infinite]" />
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border border-white dark:border-zinc-900 shadow-sm">
                        {count > 99 ? "99+" : count}
                    </span>
                </div>

                <div className="flex-1 pr-4">
                    <h3 className="font-black text-zinc-900 dark:text-white text-base leading-tight mb-1">
                        Yeni Başvurular Var!
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-3 font-medium">
                        <strong className="text-red-600 dark:text-red-400">{count} kişi</strong> sisteme kayıt oldu ve onayınızı bekliyor.
                    </p>
                    <Link
                        onClick={() => setIsVisible(false)}
                        href="/admin/approvals"
                        className="inline-flex flex-1 w-full items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                    >
                        <UserPlus className="w-4 h-4" /> İncele ve Onayla <ArrowRight className="w-3 h-3" />
                    </Link>
                </div>

                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
