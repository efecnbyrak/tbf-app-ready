"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { KvkkContent } from "@/components/kvkk/KvkkContent";

export default function KVKKPage() {
    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-bold mb-8 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    Ana Sayfaya Dön
                </Link>

                <KvkkContent variant="page" />

                <p className="mt-8 text-center text-zinc-400 text-xs font-bold italic">© 2026 Basketbol Koordinasyon Sistemi - Tüm Hakları Saklıdır</p>
            </div>
        </div>
    );
}
