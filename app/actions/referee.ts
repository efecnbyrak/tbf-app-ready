'use server'

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ProfileSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    phone: z.string().min(10, "Telefon numarası en az 10 haneli olmalıdır.").max(15, "Telefon numarası çok uzun."),
});

export async function updateRefereeProfile(formData: FormData) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return { error: "Oturum açmanız gerekiyor." };
    }

    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // Validate
    const validatedFields = ProfileSchema.safeParse({ email, phone });
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.phone?.[0] || "Geçersiz veri." };
    }

    try {
        // Check if email is taken by another referee (if changed)
        // Note: Email is unique in Referee model.
        const currentReferee = await db.referee.findUnique({ where: { userId: session.userId } });

        if (currentReferee?.email !== email) {
            const existing = await db.referee.findUnique({ where: { email } });
            if (existing) {
                return { error: "Bu e-posta adresi başka bir hakem tarafından kullanılıyor." };
            }
        }

        await db.referee.update({
            where: { userId: session.userId },
            data: {
                email: email,
                phone: phone,
            }
        });

        revalidatePath("/referee");
        return { success: true };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Profil güncellenirken bir hata oluştu." };
    }
}
