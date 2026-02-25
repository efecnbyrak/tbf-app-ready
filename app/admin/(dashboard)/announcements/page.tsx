import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AnnouncementClient from "./AnnouncementClient";
import { Megaphone, History } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    // Fetch recent announcements
    let recentAnnouncements = [];
    try {
        recentAnnouncements = (await db.$queryRawUnsafe(`
            SELECT * FROM announcements 
            ORDER BY "createdAt" DESC 
            LIMIT 10
        `)) as any[];
    } catch (e) {
        // Table might not exist yet
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Duyuru Sistemi</h1>
                    <p className="text-sm text-zinc-500 font-bold uppercase italic">Toplu Bilgilendirme ve E-posta</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="xl:col-span-2">
                    <AnnouncementClient />
                </div>

                {/* History Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-zinc-400">
                        <History className="w-4 h-4" />
                        <h3 className="text-xs font-black uppercase tracking-widest italic">Son Duyurular</h3>
                    </div>

                    <div className="space-y-4">
                        {recentAnnouncements.length === 0 ? (
                            <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                                <p className="text-xs font-bold text-zinc-500 uppercase italic">Henüz duyuru gönderilmedi</p>
                            </div>
                        ) : (
                            (recentAnnouncements as any[]).map((ann: any) => (
                                <div key={ann.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded text-[10px] font-black uppercase">
                                            {ann.target}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-400">
                                            {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 truncate">{ann.subject}</h4>
                                    <p className="text-[10px] text-zinc-500 font-bold">{ann.sentCount} kişiye ulaştı</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
