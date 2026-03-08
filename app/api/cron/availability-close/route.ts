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
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const settings = await getSettings();
        if (!settings.availabilityCloseTime) {
            return NextResponse.json({ message: "Availability close time not configured" });
        }

        // Get this week's Monday to find active forms
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const nextMonday = new Date(today);
        nextMonday.setDate(diff + 7);
        nextMonday.setHours(0, 0, 0, 0);

        // Find all users who HAVEN'T submitted this week's form yet
        const submittedForms = await db.availabilityForm.findMany({
            where: {
                weekStartDate: nextMonday
            },
            select: { refereeId: true, officialId: true }
        });

        const submittedRefereeIds = submittedForms.map(f => f.refereeId).filter(Boolean);
        const submittedOfficialIds = submittedForms.map(f => f.officialId).filter(Boolean);

        const unsubmittedReferees = await db.referee.findMany({
            where: {
                email: { not: null },
                id: { notIn: submittedRefereeIds as number[] }
            } as any,
            select: { email: true, firstName: true, lastName: true },
        });

        const unsubmittedOfficials = await db.generalOfficial.findMany({
            where: {
                email: { not: null },
                id: { notIn: submittedOfficialIds as number[] }
            } as any,
            select: { email: true, firstName: true, lastName: true },
        });

        const targetUsers = [...unsubmittedReferees, ...unsubmittedOfficials].filter(u => !!u.email);

        const { sendEmailSafe } = await import("@/lib/email");

        let successCount = 0;
        let failCount = 0;

        const chunkedUsers = chunkArray(targetUsers, 20);

        for (const chunk of chunkedUsers) {
            await Promise.allSettled(chunk.map(async (user) => {
                if (!user.email) return;
                const html = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; padding: 20px;">
                        <h2 style="color: #ea580c; text-transform: uppercase;">⏰ Uygunluk Formu Kapanmak Üzere</h2>
                        <p>Sayın <strong>${user.firstName} ${user.lastName}</strong>,</p>
                        <p>Önümüzdeki hafta için uygunluk formunu <strong>henüz doldurmadığınızı</strong> fark ettik.</p>
                        <p>Form, bugün saat <strong>20:30'da</strong> kapanacaktır. Görev alabilmek için lütfen formunuzu doldurunuz.</p>
                        <div style="margin: 30px 0; text-align: center;">
                            <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Hemen Doldur</a>
                        </div>
                        <p style="font-size: 12px; color: #666; font-style: italic;">Basketbol Koordinasyon Merkezi</p>
                    </div>
                `;
                try {
                    await sendEmailSafe(user.email, "Son Uyarı: Uygunluk Formu Kapanıyor - BKS", html);
                    successCount++;
                } catch (e) {
                    failCount++;
                }
            }));

            await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return NextResponse.json({ success: true, message: `Sent: ${successCount}, Failed: ${failCount}` });

    } catch (error: any) {
        console.error("Cron Error (Close):", error);
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
