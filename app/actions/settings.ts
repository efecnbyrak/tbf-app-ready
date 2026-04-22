"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateSystemSetting(key: string, value: string) {
    const session = await verifySession();
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.role || "")) {
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

export async function updateSystemSettingsBatch(settings: { key: string; value: string }[]) {
    const session = await verifySession();
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.role || "")) {
        return { error: "Yetkisiz işlem." };
    }

    try {
        await db.$transaction(
            settings.map(s => db.systemSetting.upsert({
                where: { key: s.key },
                create: { key: s.key, value: s.value },
                update: { value: s.value }
            }))
        );

        revalidatePath("/admin/settings");
        revalidatePath("/admin/availability");
        revalidatePath("/referee/availability");
        return { success: true };
    } catch (e) {
        console.error("[SETTINGS] Batch update failed:", e);
        return { error: "Ayarlar toplu olarak güncellenemedi." };
    }
}

export async function advanceWeek() {
    const session = await verifySession();
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.role || "")) return { error: "Yetkisiz işlem" };

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

        // Increment week counter
        const weekCounterSetting = await db.systemSetting.findUnique({ where: { key: "CURRENT_WEEK_NUMBER" } });
        const currentWeekNumber = weekCounterSetting ? parseInt(weekCounterSetting.value) : 1;
        const newWeekNumber = currentWeekNumber + 1;

        await db.systemSetting.upsert({
            where: { key: "CURRENT_WEEK_NUMBER" },
            create: { key: "CURRENT_WEEK_NUMBER", value: String(newWeekNumber) },
            update: { value: String(newWeekNumber) }
        });

        // Update LAST_WEEK_ROLLOVER_DATE to match the current Monday to prevent automatic double rollover
        const today = new Date();
        const mondayThreshold = new Date(today);
        const day = today.getDay();
        const diff = (day === 0 ? 6 : day - 1);
        mondayThreshold.setDate(today.getDate() - diff);
        mondayThreshold.setHours(0, 0, 0, 0);

        await db.systemSetting.upsert({
            where: { key: "LAST_WEEK_ROLLOVER_DATE" },
            create: { key: "LAST_WEEK_ROLLOVER_DATE", value: mondayThreshold.toISOString() },
            update: { value: mondayThreshold.toISOString() }
        });

        // Ensure it's a string YYYY-MM-DD or ISO
        await db.systemSetting.upsert({
            where: { key: "AVAILABILITY_TARGET_DATE" },
            create: { key: "AVAILABILITY_TARGET_DATE", value: nextWeek.toISOString() },
            update: { value: nextWeek.toISOString() }
        });

        // Clear manual override so auto-rollover resumes from here
        await db.systemSetting.upsert({
            where: { key: "AVAILABILITY_TARGET_MANUAL" },
            create: { key: "AVAILABILITY_TARGET_MANUAL", value: "false" },
            update: { value: "false" }
        });

        revalidatePath("/admin/settings");
        revalidatePath("/admin/availability");
        revalidatePath("/referee/availability");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "İşlem başarısız" };
    }
}

export async function resetWeekCounter() {
    const session = await verifySession();
    const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
    if (!allowedRoles.includes(session.role || "")) return { error: "Yetkisiz işlem" };

    try {
        await db.systemSetting.upsert({
            where: { key: "CURRENT_WEEK_NUMBER" },
            create: { key: "CURRENT_WEEK_NUMBER", value: "1" },
            update: { value: "1" }
        });

        revalidatePath("/admin/settings");
        revalidatePath("/admin/availability");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "İşlem başarısız" };
    }
}
