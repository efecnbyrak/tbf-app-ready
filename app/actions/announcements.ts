"use server";

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
    if (!session?.role || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        throw new Error("Unauthorized");
    }

    try {
        await ensureAnnouncementTable();

        // 1. Find target users
        let recipients: Array<{ email: string }> = [];

        if (target === "ALL") {
            recipients = await db.$queryRaw<Array<{ email: string }>>`
                SELECT email FROM (
                    SELECT email FROM referees WHERE email IS NOT NULL
                    UNION ALL
                    SELECT email FROM general_officials WHERE email IS NOT NULL
                ) combined
            `;
        } else {
            recipients = await db.$queryRaw<Array<{ email: string }>>`
                SELECT email FROM (
                    SELECT email, 'REFEREE' as "officialType" FROM referees WHERE email IS NOT NULL
                    UNION ALL
                    SELECT email, "officialType" FROM general_officials WHERE email IS NOT NULL
                ) combined
                WHERE "officialType" = ${target}
            `;
        }

        if (recipients.length === 0) {
            return { success: false, message: "Hedef kitlede kullanıcı bulunamadı." };
        }

        // 2. Send emails in parallel
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tbf-hakem-sistemi.vercel.app";
        const emailPromises = recipients.map(async (user) => {
            try {
                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05); border: 1px solid #e4e4e7; }
                            .header { background-color: #ef4444; padding: 40px 20px; text-align: center; }
                            .header img { width: 80px; height: auto; filter: brightness(0) invert(1); }
                            .content { padding: 40px; color: #18181b; line-height: 1.6; }
                            .title { font-size: 24px; font-weight: 800; color: #ef4444; margin-bottom: 24px; text-transform: uppercase; letter-spacing: -0.025em; }
                            .message { font-size: 16px; color: #3f3f46; white-space: pre-wrap; }
                            .footer { background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #f1f1f1; }
                            .footer p { font-size: 12px; color: #a1a1aa; margin: 5px 0; }
                            .button { display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; margin-top: 30px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <div style="display:inline-block;padding:12px 24px;background:rgba(255,255,255,0.2);border-radius:12px;color:white;font-weight:900;font-size:32px;italic:true;">BKS</div>
                            </div>
                            <div class="content">
                                <h1 class="title">${subject}</h1>
                                <div class="message">${content}</div>
                                <a href="${appUrl}" class="button">Sisteme Giriş Yap</a>
                            </div>
                            <div class="footer">
                                <p>© ${new Date().getFullYear()}</p>
                                <p>Bu otomatik bir sistem e-postasıdır. Lütfen yanıtlamayınız.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                `;
                await sendEmailSafe(user.email, subject, html);
                return true;
            } catch (e) {
                console.error(`Failed to send announcement to ${user.email}:`, e);
                return false;
            }
        });

        const results = await Promise.all(emailPromises);
        const successCount = results.filter(Boolean).length;

        // 3. Save announcement record
        await db.announcement.create({
            data: {
                subject,
                content,
                target,
                senderId: session.userId,
                sentCount: successCount
            }
        });

        // Rotation Logic: If announcements count > 5 and 2 weeks have passed, delete older ones and only keep the newly added one.
        try {
            const announcementsForTarget = await db.announcement.findMany({
                where: { target },
                orderBy: { createdAt: "desc" }
            });

            if (announcementsForTarget.length > 5) {
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

                const hasOldAnnouncements = announcementsForTarget.some(a => a.createdAt < twoWeeksAgo);

                if (hasOldAnnouncements) {
                    // Keep only the newest one
                    const idsToDelete = announcementsForTarget.slice(1).map(a => a.id);
                    
                    if (idsToDelete.length > 0) {
                        await db.announcementRead.deleteMany({
                            where: { announcementId: { in: idsToDelete } }
                        });
                        await db.announcement.deleteMany({
                            where: { id: { in: idsToDelete } }
                        });
                        console.log(`[ANNOUNCEMENT ROTATION] Deleted ${idsToDelete.length} old announcements for target ${target}`);
                    }
                }
            }
        } catch (rotationError) {
            console.error("[ANNOUNCEMENT ROTATION ERROR]", rotationError);
        }

        await logAction(session.userId, "ANNOUNCEMENT_SENT", `Sent to ${successCount} users: ${subject}`);

        return { success: true, message: `${successCount} adet e-posta başarıyla gönderildi.`, count: successCount };
    } catch (error) {
        console.error("[ANNOUNCEMENT ERROR]", error);
        return { success: false, message: (error as any).message || "Bilinmeyen bir hata oluştu." };
    }
}

export async function getAnnouncements() {
    const session = await getSession();
    if (!session || !session.userId) {
        return [];
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: {
                referee: true,
                official: true
            }
        });

        if (!user) return [];

        const userType = user.referee ? "REFEREE" : (user.official as any)?.officialType || "ALL";

        const announcements = await db.announcement.findMany({
            where: {
                OR: [
                    { target: "ALL" },
                    { target: userType }
                ]
            },
            include: {
                reads: {
                    where: { userId: session.userId }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return announcements.map(a => ({
            id: a.id,
            subject: a.subject,
            content: a.content,
            createdAt: a.createdAt,
            isRead: a.reads.length > 0
        }));
    } catch (error) {
        console.error("[GET_ANNOUNCEMENTS_ERROR]", error);
        return [];
    }
}

export async function markAnnouncementAsRead(announcementId: number) {
    const session = await getSession();
    if (!session || !session.userId) {
        return { success: false };
    }

    try {
        await db.announcementRead.upsert({
            where: {
                announcementId_userId: {
                    announcementId,
                    userId: session.userId
                }
            },
            create: {
                announcementId,
                userId: session.userId
            },
            update: {}
        });
        return { success: true };
    } catch (error) {
        console.error("[MARK_READ_ERROR]", error);
        return { success: false };
    }
}

export async function deleteAnnouncement(announcementId: number) {
    const session = await getSession();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        return { success: false, message: "Yetkisiz işlem." };
    }

    try {
        await db.announcementRead.deleteMany({
            where: { announcementId }
        });
        await db.announcement.delete({
            where: { id: announcementId }
        });

        await logAction(session.userId, "ANNOUNCEMENT_DELETED", `Deleted announcement ID: ${announcementId}`);
        return { success: true, message: "Duyuru başarıyla silindi." };
    } catch (error) {
        console.error("[DELETE_ANNOUNCEMENT_ERROR]", error);
        return { success: false, message: "Duyuru silinirken bir hata oluştu." };
    }
}

export async function getAnnouncementReadReceipts(announcementId: number) {
    const session = await getSession();
    if (!session || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        return { success: false, data: [] };
    }

    try {
        const announcement = await db.announcement.findUnique({
            where: { id: announcementId },
            include: { reads: { select: { userId: true, readAt: true } } }
        });

        if (!announcement) return { success: false, data: [] };

        const readUserIds = new Set(announcement.reads.map(r => r.userId));
        const readDetails = new Map(announcement.reads.map(r => [r.userId, r.readAt]));

        let targetUsers: any[] = [];
        if (announcement.target === "ALL") {
            const refs = await db.referee.findMany({ select: { userId: true, firstName: true, lastName: true, imageUrl: true }, where: { user: { isActive: true } }});
            const offs = await db.generalOfficial.findMany({ select: { userId: true, firstName: true, lastName: true, imageUrl: true }, where: { user: { isActive: true } }});
            targetUsers = [...refs, ...offs];
        } else {
            if (announcement.target === "REFEREE") {
                targetUsers = await db.referee.findMany({ select: { userId: true, firstName: true, lastName: true, imageUrl: true }, where: { user: { isActive: true } }});
            } else {
                targetUsers = await db.generalOfficial.findMany({ 
                    where: { officialType: announcement.target, user: { isActive: true } },
                    select: { userId: true, firstName: true, lastName: true, imageUrl: true }
                });
            }
        }

        const uniqueUsers = Array.from(new Map(targetUsers.map(u => [u.userId, u])).values());

        const results = uniqueUsers.map(u => ({
            userId: u.userId,
            name: `${u.firstName} ${u.lastName}`,
            imageUrl: u.imageUrl,
            hasRead: readUserIds.has(u.userId),
            readAt: readUserIds.has(u.userId) ? readDetails.get(u.userId) : null
        }));

        results.sort((a, b) => {
            if (a.hasRead === b.hasRead) return a.name.localeCompare(b.name, 'tr');
            return a.hasRead ? -1 : 1;
        });

        return { success: true, data: results };

    } catch (e) {
        console.error("GET_ANNOUNCEMENT_READS_ERROR", e);
        return { success: false, data: [] };
    }
}

