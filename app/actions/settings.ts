"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateSystemSetting(key: string, value: string) {
    const session = await verifySession();
    if (session.role !== "ADMIN") {
        return { error: "Yetkisiz işlem." };
    }

    try {
        await db.systemSetting.upsert({
            where: { key },
            create: { key, value },
            update: { value }
        });
        revalidatePath("/admin/settings");
        revalidatePath("/referee/availability");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Güncelleme başarısız." };
    }
}

export async function advanceWeek() {
    const session = await verifySession();
    if (session.role !== "ADMIN") return { error: "Yetkisiz işlem" };

    try {
        // Get current target or default
        let currentTarget = new Date();
        const s = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_TARGET_DATE" } });

        if (s && s.value) {
            currentTarget = new Date(s.value);
        } else {
            // Logic to find next Saturday from now if not set
            const today = new Date();
            const currentDay = today.getDay();
            const daysSinceSaturday = (currentDay + 1) % 7;
            const currentCycleStart = new Date(today);
            currentCycleStart.setDate(today.getDate() - daysSinceSaturday);
            currentTarget = new Date(currentCycleStart);
            currentTarget.setDate(currentCycleStart.getDate() + 7);
        }

        // Add 7 days
        const nextWeek = new Date(currentTarget);
        nextWeek.setDate(currentTarget.getDate() + 7);
        // Ensure it's a string YYYY-MM-DD or ISO
        await db.systemSetting.upsert({
            where: { key: "AVAILABILITY_TARGET_DATE" },
            create: { key: "AVAILABILITY_TARGET_DATE", value: nextWeek.toISOString() },
            update: { value: nextWeek.toISOString() }
        });

        revalidatePath("/admin/settings");
        revalidatePath("/referee/availability");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "İşlem başarısız" };
    }
}
