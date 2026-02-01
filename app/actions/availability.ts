"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getAvailabilityWindow } from "@/lib/availability-utils";

export interface ActionState {
    error?: string;
    success: boolean;
}

export async function saveAvailability(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const session = await verifySession();
    const userId = session.userId; // This is User ID. Referee has userId.

    const referee = await db.referee.findUnique({ where: { userId } });
    if (!referee) return { error: "Hakem profili bulunamadı.", success: false };

    const { startDate, isLocked } = await getAvailabilityWindow();

    if (isLocked) {
        return { error: "Form gönderim süresi doldu.", success: false };
    }

    // 1. Update Profile Fields (Phone, Regions)
    const phone = formData.get("phone") as string;
    const regionNames = formData.getAll("regions") as string[];

    // Update Referee
    // Regions is many-to-many. Always update regions to match form
    try {
        // Ensure regions exist by upserting them
        // This guarantees that even if the DB is empty/reset, valid regions from the form will be created
        const verifiedRegionIds: number[] = [];

        for (const name of regionNames) {
            // Only allow specific valid regions to prevent spam if needed, 
            // but for now we trust the form values "Avrupa", "Asya", "BGM"
            if (["Avrupa", "Asya", "BGM"].includes(name)) {
                const region = await db.region.upsert({
                    where: { name },
                    create: { name },
                    update: {},
                });
                verifiedRegionIds.push(region.id);
            }
        }

        // Always update phone and regions to match form data
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
        // Form is unique by [refereeId, weekStartDate]
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

        // Save Days
        // We expect inputs like `day_0_status` (on/off), `day_0_slot` (string)
        // Loop 0 to 6 (Sat to Fri)
        for (let i = 0; i < 7; i++) {
            const isAvailable = formData.get(`day_${i}_available`) === "on";
            const slot = formData.get(`day_${i}_slot`) as string;

            // Calc date
            const dayDate = new Date(startDate);
            dayDate.setDate(startDate.getDate() + i);

            // In AvailabilityDay table
            // We might have existing days. deleteMany for this form first? 
            // Or upsert each day? `AvailabilityDay` has no unique constraint usually, but we can rely on formId.
            // Let's delete old days for this form and re-create to be safe/clean logic.
        }

        // Better approach: Transaction deletion and recreation of days
        await db.$transaction(async (tx) => {
            await tx.availabilityDay.deleteMany({
                where: { formId: form.id }
            });

            for (let i = 0; i < 7; i++) {
                const slot = formData.get(`day_${i}_slot`) as string;

                // If slot is valid and NOT "Uygun Değil"
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
                }
            }
        });

        revalidatePath("/referee/availability");
        return { success: true, error: undefined };

    } catch (e) {
        console.error(e);
        return { error: "Kaydedilemedi.", success: false };
    }
}
