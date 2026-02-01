"use client";

import { LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export function SignOutButton() {
    return (
        <button
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-red-600 transition-colors"
            onClick={async () => {
                await logout();
            }}
        >
            <LogOut className="w-5 h-5" />
            Hesaptan Çıkış Yap
        </button>
    );
}
