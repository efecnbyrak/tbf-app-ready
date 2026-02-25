import { db } from "./db";
import { headers } from "next/headers";

export async function logAction(userId: number | null, action: string, details?: string, targetId?: number) {
    try {
        const headerList = await headers();
        const ipAddress = headerList.get("x-forwarded-for") || "127.0.0.1";

        await db.auditLog.create({
            data: {
                userId,
                action,
                details,
                targetId,
                ipAddress
            }
        });
    } catch (error) {
        console.error("[LOGGER ERROR] Failed to create audit log:", error);
    }
}
