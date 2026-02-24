"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { sendAvailabilityConfirmationEmail } from "@/lib/email";
import { ensureSchemaColumns } from "./auth";

export interface ActionState {
    error?: string;
    success: boolean;
}

export async function saveAvailability(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await verifySession();
    const userId = session.userId;

    await ensureSchemaColumns();

    const referee = await db.referee.findUnique({
        where: { userId },
        include: {
            regions: true,
            user: true // Include user to check suspension
        }
    });
    if (!referee) return { error: "Hakem profili bulunamadı.", success: false };

    if (referee.user.suspendedUntil && referee.user.suspendedUntil > new Date()) {
        const dateStr = referee.user.suspendedUntil.toLocaleDateString('tr-TR');
        return { error: `Hesabınız ${dateStr} tarihine kadar dondurulmuştur. Bu süre zarfında uygunluk formu dolduramazsınız.`, success: false };
    }

    const { startDate, deadline, isLocked, mode } = await getAvailabilityWindow();

    // Audit Logging
    console.log(`[ACTION] saveAvailability - User: ${referee.firstName} ${referee.lastName}, Locked: ${isLocked}, Mode: ${mode}, TargetWeek: ${startDate.toLocaleDateString()}`);

    if (isLocked) {
        return { error: "Form gönderim süresi doldu.", success: false };
    }

    // 1. Update Profile Fields (Phone, Regions)
    const phone = formData.get("phone") as string;
    const regionNames = formData.getAll("regions") as string[];

    try {
        // Ensure regions exist by upserting them
        const verifiedRegionIds: number[] = [];

        for (const name of regionNames) {
            if (["Avrupa", "Asya", "BGM"].includes(name)) {
                const region = await db.region.upsert({
                    where: { name },
                    create: { name },
                    update: {},
                });
                verifiedRegionIds.push(region.id);
            }
        }

        // Update phone and regions
        await db.referee.update({
            where: { id: referee.id },
            data: {
                phone,
                regions: {
                    set: verifiedRegionIds.map(id => ({ id }))
                }
            }
        });

        // 2. Save Form Days
        const form = await db.availabilityForm.upsert({
            where: {
                refereeId_weekStartDate: {
                    refereeId: referee.id,
                    weekStartDate: startDate
                }
            },
            create: {
                refereeId: referee.id,
                weekStartDate: startDate,
                status: "SUBMITTED"
            },
            update: {
                status: "SUBMITTED"
            }
        });

        // Collect day data for email summary
        const savedDays: { dayName: string; date: string; slots: string }[] = [];

        await db.$transaction(async (tx: any) => {
            await tx.availabilityDay.deleteMany({
                where: { formId: form.id }
            });

            for (let i = 0; i < 7; i++) {
                const slot = formData.get(`day_${i}_slot`) as string;

                if (slot && slot !== "Uygun Değil") {
                    const dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + i);

                    await tx.availabilityDay.create({
                        data: {
                            formId: form.id,
                            date: dayDate,
                            slots: slot as string
                        }
                    });

                    // Collect for email
                    savedDays.push({
                        dayName: dayDate.toLocaleDateString('tr-TR', { weekday: 'long' }),
                        date: dayDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }),
                        slots: slot
                    });
                }
            }
        });

        revalidatePath("/referee/availability");

        // 3. Send confirmation email (non-blocking — don't fail if email fails)
        try {
            const weekNum = await db.systemSetting.findUnique({ where: { key: "CURRENT_WEEK_NUMBER" } });
            const weekNumberLabel = weekNum?.value ? `${weekNum.value}. Hafta` : "İlgili Hafta";

            const weekStartStr = startDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
            const weekEndDate = new Date(startDate);
            weekEndDate.setDate(startDate.getDate() + 6);
            const weekEndStr = weekEndDate.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
            const weekLabel = `${weekNumberLabel} (${weekStartStr} – ${weekEndStr})`;

            const deadlineStr = deadline.toLocaleDateString('tr-TR', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';
            const formUrl = `${appUrl}/referee/availability`;

            await sendAvailabilityConfirmationEmail(
                referee.email,
                `${referee.firstName} ${referee.lastName}`,
                weekLabel,
                savedDays,
                deadlineStr,
                formUrl
            );
        } catch (emailError) {
            // Email failure should NOT fail the form save
            console.error("[AVAILABILITY] Email send failed (non-critical):", emailError);
        }

        return { success: true, error: undefined };

    } catch (e) {
        console.error(e);
        return { error: "Kaydedilemedi.", success: false };
    }
}
