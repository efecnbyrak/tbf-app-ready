"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

export async function clearAuditLogs() {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN") {
        throw new Error("Yetkisiz işlem. Sadece Süper Admin günlükleri temizleyebilir.");
    }

    try {
        await db.$executeRawUnsafe(`TRUNCATE TABLE audit_logs`);

        await logAction(session.userId, "LOGS_CLEARED", "All system logs were permanently cleared by Super Admin.");

        revalidatePath("/admin/logs");
        return { success: true, message: "Tüm sistem kayıtları başarıyla silindi." };
    } catch (error: any) {
        console.error("[LOGS CLEAR ERROR]", error);
        return { success: false, message: "Kayıtlar silinirken bir hata oluştu: " + error.message };
    }
}
