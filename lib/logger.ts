import { db } from "./db";
import { headers } from "next/headers";

let isAuditLogTableChecked = false;

export async function ensureAuditLogTable() {
    if (isAuditLogTableChecked) return;
    try {
        await db.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                "userId" INTEGER,
                action TEXT NOT NULL,
                details TEXT,
                "targetId" INTEGER,
                "ipAddress" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        // Silently fail if exists or other DB issue
    } finally {
        isAuditLogTableChecked = true;
    }
}

export async function logAction(userId: number | null, action: string, details?: string, targetId?: number) {
    try {
        await ensureAuditLogTable();

        const headerList = await headers();
        const ipAddress = headerList.get("x-forwarded-for") || "127.0.0.1";

        try {
            await (db as any).auditLog.create({
                data: {
                    userId,
                    action,
                    details,
                    targetId,
                    ipAddress
                }
            });
        } catch (prismaError) {
            // Fallback to raw SQL if table exists but Prisma model is stale
            await db.$executeRawUnsafe(`
                INSERT INTO audit_logs ("userId", action, details, "targetId", "ipAddress", "createdAt")
                VALUES ($1, $2, $3, $4, $5, NOW())
            `, userId, action, details || null, targetId || null, ipAddress);
        }
    } catch (error) {
        console.error("[LOGGER ERROR] Failed to create audit log:", error);
    }
}
