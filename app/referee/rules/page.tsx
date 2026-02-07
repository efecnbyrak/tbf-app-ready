
import { Folder, Key, Video, BookOpen, Zap, MessageSquare } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ChatInterface } from "@/components/chat/ChatInterface";

export const dynamic = 'force-dynamic';

export default async function RulesPage() {
    const session = await getSession();

    // Fetch Chat Session
    let chatSession = null;
    if (session?.userId) {
        chatSession = await db.chatSession.findFirst({
            where: { userId: session.userId },
            orderBy: { updatedAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }

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

            {/* AI Assistant Section */}
            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
                        <MessageSquare className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">AI Kural Asistanı</h2>
                        <p className="text-zinc-500">FIBA ve TBF kuralları hakkında sorularını sor.</p>
                    </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-[600px] overflow-hidden shadow-inner">
                    <ChatInterface
                        initialMessages={chatSession?.messages.map((m: any) => ({
                            ...m,
                            createdAt: m.createdAt,
                            role: m.role as "user" | "assistant"
                        })) || []}
                        sessionId={chatSession?.id || ""}
                        userId={session?.userId || 0}
                    />
                </div>
            </div>
        </div>
    );
}
