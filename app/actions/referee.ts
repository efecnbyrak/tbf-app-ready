'use server'

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isValidTurkishIBAN } from "@/lib/iban-validator";
import { put } from "@vercel/blob";

const ProfileSchema = z.object({
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    phone: z.string().min(10, "Telefon numarası en az 10 haneli olmalıdır.").max(15, "Telefon numarası çok uzun."),
    address: z.string().optional(),
    iban: z.string()
        .optional()
        .refine((val) => !val || isValidTurkishIBAN(val), {
            message: "Geçersiz IBAN formatı. TR ile başlayan, 26 haneli ve geçerli bir IBAN giriniz."
        }),
});

export async function updateRefereeProfile(formData: FormData) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return { error: "Oturum açmanız gerekiyor." };
    }

    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string || "";
    const iban = formData.get("iban") as string || "";

    // Validate
    const validatedFields = ProfileSchema.safeParse({ email, phone, address, iban });
    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors.email?.[0] || validatedFields.error.flatten().fieldErrors.phone?.[0] || "Geçersiz veri." };
    }

    try {
        const currentReferee = await db.referee.findUnique({ where: { userId: session.userId } });
        const currentOfficial = !currentReferee ? await db.generalOfficial.findUnique({ where: { userId: session.userId } }) : null;

        const existingEmail = currentReferee?.email || currentOfficial?.email;
        let emailUpdateMessage = "";

        if (existingEmail !== email) {
            // Check if another user has this email
            const otherRef = await db.referee.findFirst({ where: { email, NOT: { userId: session.userId } } });
            const otherOff = await db.generalOfficial.findFirst({ where: { email, NOT: { userId: session.userId } } });

            if (otherRef || otherOff) {
                return { error: "Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor." };
            }

            // Generate Verification Token
            const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
            const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

            await db.user.update({
                where: { id: session.userId },
                data: {
                    pendingEmail: email,
                    verificationCode: token,
                    verificationCodeExpiresAt: expiresAt
                }
            });

            // Send Verification Email to the NEW email
            try {
                const { sendEmailChangeVerification } = await import("@/lib/email");
                const { headers } = await import("next/headers");
                const host = (await headers()).get("host") || "localhost:3000";
                const protocol = host.includes("localhost") ? "http" : "https";
                const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
                const verificationUrl = `${appUrl}/verify-email?token=${token}&type=change`;

                await sendEmailChangeVerification(email, verificationUrl);
                emailUpdateMessage = " E-posta değişikliği için yeni adresinize onay bağlantısı gönderildi.";
            } catch (emailError) {
                console.error("Email change error:", emailError);
            }
        }

        // Update other fields immediately (Phone, Address, IBAN)
        if (currentReferee) {
            await db.referee.update({
                where: { userId: session.userId },
                data: {
                    phone: phone,
                    address: address,
                    iban: iban,
                }
            });
        } else if (currentOfficial) {
            await db.generalOfficial.update({
                where: { userId: session.userId },
                data: {
                    phone: phone,
                    address: address,
                    iban: iban,
                }
            });
        }

        revalidatePath("/referee");
        return { success: true, message: `Profil başarıyla güncellendi.${emailUpdateMessage}` };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Profil güncellenirken bir hata oluştu." };
    }
}

export async function updateUserAvatar(formData: FormData) {
    const session = await verifySession();
    if (!session || !session.userId) {
        return { error: "Yetkisiz işlem." };
    }

    const file = formData.get("file") as File;
    if (!file) {
        return { error: "Dosya yüklenemedi." };
    }

    try {
        // Direct Server Upload to Vercel Blob using put()
        const blob = await put(`avatars/${session.userId}-${Date.now()}-${file.name}`, file, {
            access: 'public',
        });

        const currentReferee = await db.referee.findUnique({ where: { userId: session.userId } });

        if (currentReferee) {
            await db.referee.update({
                where: { userId: session.userId },
                data: { imageUrl: blob.url }
            });
        } else {
            const currentOfficial = await db.generalOfficial.findUnique({ where: { userId: session.userId } });
            if (currentOfficial) {
                await db.generalOfficial.update({
                    where: { userId: session.userId },
                    data: { imageUrl: blob.url }
                });
            }
        }

        revalidatePath("/referee");
        revalidatePath("/admin/referees");
        revalidatePath("/admin/officials");

        return { success: true, url: blob.url };
    } catch (error: any) {
        console.error("Avatar update error:", error);
        return { error: error.message || "Fotoğraf yüklenirken bir hata oluştu." };
    }
}
