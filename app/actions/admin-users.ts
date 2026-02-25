"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { ensureSchemaColumns } from "./auth";

export async function approveUser(userId: number) {
    await ensureSchemaColumns();
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    const user = await db.user.update({
        where: { id: userId },
        data: { isApproved: true },
        include: { referee: true }
    });

    // Notify user via email (simplified logic)
    if (user.referee?.email) {
        try {
            const { sendEmailSafe } = await import("@/lib/email");
            await sendEmailSafe(
                user.referee.email,
                "Hesabınız Onaylandı - TBF Hakem Sistemi",
                `<p>Sayın <strong>${user.referee.firstName} ${user.referee.lastName}</strong>,</p>
                 <p>Hesabınız yönetici tarafından onaylanmıştır. Artık sisteme giriş yapabilirsiniz.</p>`
            );
        } catch (e) {
            console.error("Approval email failed:", e);
        }
    }

    revalidatePath("/admin/approvals");
    revalidatePath("/admin/referees");
    return { success: true };
}

export async function rejectUser(userId: number) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    // For rejection, we must delete related records manually to avoid foreign key crashes
    // since we couldn't easily add cascade delete to the DB schema.
    await db.$transaction(async (tx: any) => {
        // Delete related records
        await tx.referee.deleteMany({ where: { userId: userId } });
        await tx.user.delete({ where: { id: userId } });
    });

    revalidatePath("/admin/approvals");
    return { success: true };
}

export async function suspendUser(userId: number, until: Date | null) {
    await ensureSchemaColumns();
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    await db.user.update({
        where: { id: userId },
        data: { suspendedUntil: until }
    });

    revalidatePath("/admin/referees");
    return { success: true };
}

export async function updateRefereeProfile(userId: number, data: {
    classification?: string;
    officialType?: string;
    points?: number;
    rating?: number;
    regionIds?: number[];
    suspendedUntil?: Date | null;
}) {
    await ensureSchemaColumns();
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    await db.$transaction(async (tx: any) => {
        // Update User fields (suspension)
        if (data.suspendedUntil !== undefined) {
            await tx.user.update({
                where: { id: userId },
                data: { suspendedUntil: data.suspendedUntil }
            });
        }

        // Update Referee fields
        const updateData: any = {};
        if (data.classification !== undefined) updateData.classification = data.classification;
        if (data.officialType !== undefined) updateData.officialType = data.officialType;
        if (data.points !== undefined) updateData.points = data.points;
        if (data.rating !== undefined) updateData.rating = data.rating;

        if (Object.keys(updateData).length > 0) {
            await tx.referee.update({
                where: { userId: userId },
                data: updateData
            });
        }

        // Update Regions if provided
        if (data.regionIds !== undefined) {
            const referee = await tx.referee.findUnique({ where: { userId: userId } });
            if (referee) {
                await tx.referee.update({
                    where: { id: referee.id },
                    data: {
                        regions: {
                            set: data.regionIds.map(id => ({ id }))
                        }
                    }
                });
            }
        }
    });

    revalidatePath("/admin/referees");
    revalidatePath("/admin/officials");
    return { success: true, message: "Profil başarıyla güncellendi." };
}

export async function cleanupOldAvailability() {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    // Delete forms where weekStartDate is older than previous Monday
    const today = new Date();
    const day = today.getDay(); // 0 (Sun) to 6 (Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday of current week
    const currentMonday = new Date(today.setDate(diff));
    currentMonday.setHours(0, 0, 0, 0);

    const lastMonday = new Date(currentMonday);
    lastMonday.setDate(currentMonday.getDate() - 7);

    // Any form where weekStartDate < lastMonday is considered "passing week"
    // User said: "diyeim 1. hafta attı geçti 2. hafta attı geçti ... 1. hafta atanlar silinsin"
    // We'll delete anything older than the Current Week's Monday to be safe, 
    // or specifically older than the Last Week's Monday.

    const deleteCount = await db.availabilityForm.deleteMany({
        where: {
            weekStartDate: {
                lt: lastMonday
            }
        }
    });

    revalidatePath("/admin/availability");
    return { success: true, count: deleteCount.count };
}

export async function deleteUser(userId: number) {
    try {
        const session = await verifySession();
        // Only allow SUPER_ADMIN to delete accounts
        if (session.role !== "SUPER_ADMIN") {
            return { success: false, message: "Yetkisiz işlem. Sadece Süper Admin silebilir." };
        }

        // Prevent self-deletion via UI
        if (session.userId === userId) {
            return { success: false, message: "Kendi hesabınızı sistemden silemezsiniz." };
        }

        const userToDelete = await db.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        if (!userToDelete) return { success: false, message: "Kullanıcı bulunamadı." };

        // Protect other SUPER_ADMIN accounts
        if (userToDelete.role.name === "SUPER_ADMIN") {
            return { success: false, message: "Bir Süper Admin hesabı bu panelden silinemez." };
        }

        await db.$transaction(async (tx: any) => {
            // Delete related tables manually to avoid FK issues
            // 1. Availability
            const availFormIds = await tx.availabilityForm.findMany({
                where: { referee: { userId: userId } },
                select: { id: true }
            });
            const formIds = availFormIds.map((f: any) => f.id);
            if (formIds.length > 0) {
                await tx.availabilityDay.deleteMany({ where: { formId: { in: formIds } } });
                await tx.availabilityForm.deleteMany({ where: { id: { in: formIds } } });
            }

            // 2. Match Assignments
            await tx.matchAssignment.deleteMany({ where: { referee: { userId: userId } } });

            // 3. Exam Attempts
            await tx.userAnswer.deleteMany({ where: { attempt: { referee: { userId: userId } } } });
            await tx.examAttempt.deleteMany({ where: { referee: { userId: userId } } });

            // 4. Video Progress
            await tx.videoProgress.deleteMany({ where: { userId: userId } });

            // 5. Chat Sessions
            await tx.message.deleteMany({ where: { session: { userId: userId } } });
            await tx.chatSession.deleteMany({ where: { userId: userId } });

            // 6. Referee Profile
            await tx.referee.deleteMany({ where: { userId: userId } });

            // 7. Finally the User
            await tx.user.delete({ where: { id: userId } });
        });

        revalidatePath("/admin/referees");
        revalidatePath("/admin/officials");
        revalidatePath("/admin/approvals");

        return { success: true, message: "Kullanıcı ve tüm verileri başarıyla silindi." };
    } catch (error: any) {
        console.error("Delete user error:", error);
        return { success: false, message: "Silme işlemi sırasında bir hata oluştu: " + error.message };
    }
}

