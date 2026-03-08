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

    let profile: any = await db.referee.findUnique({
        where: { userId },
        include: {
            regions: true,
            user: true // Include user to check suspension
        }
    });
    let isOfficial = false;

    if (!profile) {
        profile = (await db.generalOfficial.findUnique({
            where: { userId },
            include: { regions: true, user: true }
        })) as any;
        isOfficial = true;
    }

    if (!profile) return { error: "Profil bulunamadı.", success: false };

    if (profile.user.suspendedUntil && profile.user.suspendedUntil > new Date()) {
        const dateStr = profile.user.suspendedUntil.toLocaleDateString('tr-TR');
        return { error: `Hesabınız ${dateStr} tarihine kadar dondurulmuştur. Bu süre zarfında uygunluk formu dolduramazsınız.`, success: false };
    }

    const { startDate, deadline, isLocked, mode } = await getAvailabilityWindow();

    // Audit Logging
    console.log(`[ACTION] saveAvailability - User: ${profile.firstName} ${profile.lastName}, Locked: ${isLocked}, Mode: ${mode}, TargetWeek: ${startDate.toLocaleDateString()}`);

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
            if (["Avrupa", "Anadolu", "BGM"].includes(name)) {
                const region = await db.region.upsert({
                    where: { name },
                    create: { name },
                    update: {},
                });
                verifiedRegionIds.push(region.id);
            }
        }

        // Update phone and regions
        if (isOfficial) {
            await db.generalOfficial.update({
                where: { id: profile.id },
                data: {
                    phone,
                    regions: { set: verifiedRegionIds.map(id => ({ id })) }
                }
            });
        } else {
            await db.referee.update({
                where: { id: profile.id },
                data: {
                    phone,
                    regions: { set: verifiedRegionIds.map(id => ({ id })) }
                }
            });
        }

        // 2. Save Form Days
        let form = await db.availabilityForm.findFirst({
            where: {
                ...(isOfficial ? { officialId: profile.id } : { refereeId: profile.id }),
                weekStartDate: startDate
            }
        });

        if (form) {
            form = await db.availabilityForm.update({
                where: { id: form.id },
                data: { status: "SUBMITTED" }
            });
        } else {
            if (isOfficial) {
                form = await db.availabilityForm.create({
                    data: {
                        officialId: profile.id,
                        weekStartDate: startDate,
                        status: "SUBMITTED"
                    }
                });
            } else {
                form = await db.availabilityForm.create({
                    data: {
                        refereeId: profile.id,
                        weekStartDate: startDate,
                        status: "SUBMITTED"
                    }
                });
            }
        }


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
            const formUrl = isOfficial ? `${appUrl}/general/availability` : `${appUrl}/referee/availability`;

            await sendAvailabilityConfirmationEmail(
                profile.email,
                `${profile.firstName} ${profile.lastName}`,
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
