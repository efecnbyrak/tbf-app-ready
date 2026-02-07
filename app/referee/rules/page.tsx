
import { Folder, Key, Video, BookOpen, Zap } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
    const session = await getSession();

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-red-700" />
                Kural Kitabı
            </h1>
            <p className="text-zinc-500">
                Basketbol kuralları, yorumları ve eğitim videoları.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/referee/rules/kural" className="group">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                        <div className="bg-red-50 dark:bg-red-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Key className="w-8 h-8 text-red-700 dark:text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Kurallar</h2>
                        <p className="text-sm text-zinc-500">Güncel basketbol oyun kuralları ve maddeleri.</p>
                    </div>
                </Link>

                <Link href="/referee/rules/yorum" className="group">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                        <div className="bg-blue-50 dark:bg-blue-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Folder className="w-8 h-8 text-blue-700 dark:text-blue-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Yorumlar</h2>
                        <p className="text-sm text-zinc-500">Kurallara dair resmi yorumlar ve açıklamalar.</p>
                    </div>
                </Link>

                {/* Scenario Generator Restored */}
                <Link href="/referee/training" className="group">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 transform group-hover:-translate-y-1">
                        <div className="bg-purple-50 dark:bg-purple-900/20 w-16 h-16 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-8 h-8 text-purple-700 dark:text-purple-500" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Senaryo Oluşturucu</h2>
                        <p className="text-sm text-zinc-500">Rastgele pozisyon ve kural senaryoları üret.</p>
                    </div>
                </Link>
            </div>

        </div>
    );
}
