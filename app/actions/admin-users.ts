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
