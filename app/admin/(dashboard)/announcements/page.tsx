import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import AnnouncementClient from "./AnnouncementClient";
import AnnouncementHistoryList from "./AnnouncementHistoryList";
import { Megaphone, History } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AnnouncementsPage() {
    const session = await getSession();
    if (!session?.role || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        redirect("/admin/login");
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
                <AnnouncementHistoryList announcements={recentAnnouncements} />
            </div>
        </div>
    );
}
