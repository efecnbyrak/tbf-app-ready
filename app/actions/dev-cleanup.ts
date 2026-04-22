"use server";

import { db } from "@/lib/db";

export async function clearOldAnnouncementsAdmin() {
    try {
        const readsDeleted = await db.announcementRead.deleteMany({});
        const deleted = await db.announcement.deleteMany({});
        console.log(`[INIT CLEANUP] Deleted ${readsDeleted.count} reads and ${deleted.count} announcements.`);
        return { success: true };
    } catch (error) {
        console.error("Cleanup Error:", error);
        return { success: false, error };
    }
}
