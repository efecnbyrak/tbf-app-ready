import { NextResponse } from "next/server";
import { db } from "@/lib/db";

async function getSettings() {
    const defaultSettings = {
        availabilityOpenTime: "Pazar 12:00",
        availabilityCloseTime: "Salı 14:30"
    };
    try {
        const rows = await db.systemSetting.findMany({
            where: {
                key: { in: ['AVAILABILITY_OPEN_TIME', 'AVAILABILITY_CLOSE_TIME'] }
            }
        });
        const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
        return {
            availabilityOpenTime: map['AVAILABILITY_OPEN_TIME'] || defaultSettings.availabilityOpenTime,
            availabilityCloseTime: map['AVAILABILITY_CLOSE_TIME'] || defaultSettings.availabilityCloseTime
        };
    } catch {
        return defaultSettings;
    }
}

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    // Authorization check — CRON_SECRET is required
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const settings = await getSettings();
        if (!settings.availabilityOpenTime) {
            return NextResponse.json({ message: "Availability open time not configured" });
        }

        const referees = await db.referee.findMany({
            where: { email: { not: null } } as any,
            select: { email: true, firstName: true, lastName: true },
        });

        const officials = await db.generalOfficial.findMany({
            where: { email: { not: null } } as any,
            select: { email: true, firstName: true, lastName: true },
        });

        const allUsers = [...referees, ...officials].filter(u => !!u.email);

        // --- ANNOUNCEMENT IN-APP ---
        try {
            await db.announcement.create({
                data: {
                    subject: "📢 Uygunluk Formu Açıldı",
                    content: "Önümüzdeki hafta için uygunluk formunuz an itibariyle sisteme açılmıştır.\nLütfen en geç Salı günü saat 20:30'a kadar uygunluk durumunuzu sisteme giriniz.",
                    target: "ALL",
                    sentCount: allUsers.length
                }
            });
            console.log("Cron Open Announcement created successfully");
        } catch (announcementError) {
            console.error("Cron Error (Open) - Announcement Creation:", announcementError);
        }

        const { sendEmailSafe } = await import("@/lib/email");

        let successCount = 0;
        let failCount = 0;

        const chunkedUsers = chunkArray(allUsers, 20);

        // HTML-escape helper to prevent XSS in email content
        const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

        for (const chunk of chunkedUsers) {
            await Promise.allSettled(chunk.map(async (user) => {
                if (!user.email) return;
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                        <h2 style="color: #dc2626; text-transform: uppercase;">Uygunluk Formu Acildi</h2>
                        <p>Sayin <strong>${esc(user.firstName)} ${esc(user.lastName)}</strong>,</p>
                        <p>Önümüzdeki hafta için uygunluk formunuz an itibariyle sisteme açılmıştır.</p>
                        <p>Lütfen en geç <strong>Salı günü saat 20:30'a</strong> kadar uygunluk durumunuzu sisteme giriniz.</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Sisteme Giriş Yap</a>
                        </div>
                        <p style="font-size: 12px; color: #666; font-style: italic;">Basketbol Koordinasyon Merkezi</p>
                    </div>
                `;
                try {
                    await sendEmailSafe(user.email, "Hatırlatma: Uygunluk Formu Açıldı - BKS", html);
                    successCount++;
                } catch (e) {
                    failCount++;
                }
            }));

            // Wait slightly between chunks to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return NextResponse.json({ success: true, message: `Sent: ${successCount}, Failed: ${failCount}` });

    } catch (error: any) {
        console.error("Cron Error (Open):", error);
        return NextResponse.json({ error: "İşlem sırasında bir hata oluştu: " + error.message }, { status: 500 });
    }
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked_arr = [];
    for (let i = 0; i < array.length; i += size) {
        chunked_arr.push(array.slice(i, i + size));
    }
    return chunked_arr;
}
