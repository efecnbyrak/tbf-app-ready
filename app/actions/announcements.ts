import { db } from "@/lib/db";
import { sendEmailSafe } from "@/lib/email";
import { getSession } from "@/lib/session";
import { logAction } from "@/lib/logger";

export async function ensureAnnouncementTable() {
    try {
        await db.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                subject TEXT NOT NULL,
                content TEXT NOT NULL,
                target TEXT DEFAULT 'ALL',
                "senderId" INTEGER,
                "sentCount" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    } catch (e) {
        // Silently fail if exists
    }
}

export async function sendAnnouncement(subject: string, content: string, target: string = "ALL") {
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        await ensureAnnouncementTable();

        // 1. Find target users
        let query = `SELECT email FROM referees WHERE email IS NOT NULL`;
        if (target !== "ALL") {
            query += ` AND "officialType" = '${target}'`;
        }

        const recipients = await db.$queryRawUnsafe<Array<{ email: string }>>(query);

        if (recipients.length === 0) {
            return { success: false, message: "Hedef kitlede kullanıcı bulunamadı." };
        }

        // 2. Send emails
        let successCount = 0;
        for (const user of recipients) {
            try {
                const html = `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                        <img src="${process.env.NEXT_PUBLIC_APP_URL}/favicon.png" width="50" height="50" style="display: block; margin-bottom: 20px;">
                        <h2 style="color: #ef4444; text-transform: uppercase;">Duyuru</h2>
                        <div style="font-size: 16px; line-height: 1.6; color: #333;">
                            ${content.replace(/\n/g, '<br/>')}
                        </div>
                        <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;">
                        <p style="font-size: 12px; color: #999;">Bu bir sistem duyurusudur. Lütfen bu e-postayı yanıtlamayın.</p>
                    </div>
                `;
                await sendEmailSafe(user.email, subject, html);
                successCount++;
            } catch (e) {
                console.error(`Failed to send announcement to ${user.email}:`, e);
            }
        }

        // 3. Save announcement record
        await db.$executeRawUnsafe(`
            INSERT INTO announcements (subject, content, target, "senderId", "sentCount")
            VALUES ($1, $2, $3, $4, $5)
        `, subject, content, target, session.userId, successCount);

        await logAction(session.userId, "ANNOUNCEMENT_SENT", `Sent to ${successCount} users: ${subject}`);

        return { success: true, count: successCount };
    } catch (error) {
        console.error("[ANNOUNCEMENT ERROR]", error);
        return { success: false, error: (error as any).message };
    }
}
