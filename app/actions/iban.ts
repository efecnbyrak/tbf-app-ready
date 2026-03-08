"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateUserIBAN(iban: string) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return { error: "Oturum bulunamadı." };
    }

    try {
        // Try to update referee first
        const referee = await db.referee.findUnique({ where: { userId: session.userId } });
        if (referee) {
            await db.referee.update({
                where: { userId: session.userId },
                data: { iban }
            });
        } else {
            // Try updating general official
            const official = await db.generalOfficial.findUnique({ where: { userId: session.userId } });
            if (official) {
                await db.generalOfficial.update({
                    where: { userId: session.userId },
                    data: { iban }
                });
            } else {
                return { error: "Kullanıcı kaydı bulunamadı." };
            }
        }

        revalidatePath("/");
        revalidatePath("/referee");
        revalidatePath("/general");
        return { success: true };
    } catch (e) {
        console.error("[IBAN_UPDATE] Error:", e);
        return { error: "IBAN güncellenirken bir hata oluştu." };
    }
}
