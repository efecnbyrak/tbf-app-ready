"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function deleteReferee(refereeId: number) {
    const session = await verifySession();
    if (session.role !== "ADMIN") {
        return { error: "Yetkisiz işlem." };
    }

    try {
        const referee = await db.referee.findUnique({
            where: { id: refereeId },
            include: { user: true }
        });

        if (!referee) return { error: "Hakem bulunamadı." };

        await db.$transaction(async (tx) => {
            // 1. Delete Referee Profile
            await tx.referee.delete({ where: { id: refereeId } });

            // 2. Delete User Account
            if (referee.userId) {
                await tx.user.delete({ where: { id: referee.userId } });
            }
        });

        revalidatePath("/admin/referees");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Silme işlemi başarısız. (Bağlı veriler olabilir)" };
    }
}

export async function updateRefereeClassification(refereeId: number, classification: string) {
    const session = await verifySession();
    if (session.role !== "ADMIN") {
        return { error: "Yetkisiz işlem." };
    }

    try {
        await db.referee.update({
            where: { id: refereeId },
            data: { classification }
        });
        revalidatePath("/admin/referees");
        return { success: true };
    } catch (e) {
        return { error: "Güncelleme başarısız." };
    }
}
export async function updateRefereeType(refereeId: number, officialType: string) {
    const session = await verifySession();
    if (session.role !== "ADMIN") {
        return { error: "Yetkisiz işlem." };
    }

    try {
        // Use Raw Query to update officialType to bypass stale Prisma Client
        await db.$executeRaw`
            UPDATE referees 
            SET "officialType" = ${officialType} 
            WHERE id = ${refereeId}
        `;

        revalidatePath("/admin/referees");
        revalidatePath("/admin/officials");
        revalidatePath("/admin/availability");
        return { success: true };
    } catch (e) {
        console.error("Update error:", e);
        return { error: "Güncelleme başarısız." };
    }
}
