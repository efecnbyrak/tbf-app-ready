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
    if (session?.role !== "SUPER_ADMIN") {
        throw new Error("Unauthorized");
    }

    try {
        await ensureAnnouncementTable();

        // 1. Find target users
        let recipients: Array<{ email: string }> = [];

        if (target === "ALL") {
            recipients = await db.$queryRaw<Array<{ email: string }>>`
                SELECT email FROM referees WHERE email IS NOT NULL
            `;
        } else {
            recipients = await db.$queryRaw<Array<{ email: string }>>`
                SELECT email FROM referees WHERE email IS NOT NULL AND "officialType" = ${target}
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
                                <img src="${appUrl}/download.png" alt="TBF Logo">
                            </div>
                            <div class="content">
                                <h1 class="title">${subject}</h1>
                                <div class="message">${content}</div>
                                <a href="${appUrl}" class="button">Sisteme Giriş Yap</a>
                            </div>
                            <div class="footer">
                                <p>© ${new Date().getFullYear()} Türkiye Basketbol Federasyonu</p>
                                <p>Bu otomatik bir sistem e-postasıdır. Lütfen yanıtlamayınız.</p>
                                <div style="margin-top: 15px;">
                                    <img src="${appUrl}/favicon.png" width="24" height="24" style="opacity: 0.5;">
                                </div>
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
        await db.$executeRaw`
            INSERT INTO announcements (subject, content, target, "senderId", "sentCount")
            VALUES (${subject}, ${content}, ${target}, ${session.userId}, ${successCount})
        `;

        await logAction(session.userId, "ANNOUNCEMENT_SENT", `Sent to ${successCount} users: ${subject}`);

        return { success: true, message: `${successCount} adet e-posta başarıyla gönderildi.`, count: successCount };
    } catch (error) {
        console.error("[ANNOUNCEMENT ERROR]", error);
        return { success: false, message: (error as any).message || "Bilinmeyen bir hata oluştu." };
    }
}
