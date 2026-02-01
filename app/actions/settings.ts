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
