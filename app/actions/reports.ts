"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function submitObserverReport(formData: FormData) {
    const session = await verifySession();
    if (session.role !== "REFEREE" && session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "OFFICIAL") {
        return { error: "Yetkisiz işlem" };
    }
    const userId = session.userId;

    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const imageUrl = formData.get("imageUrl") as string; // Base64 string from UI

    if (!title || !content) {
        return { error: "Başlık ve içerik gereklidir." };
    }

    try {
        const report = await db.observerReport.create({
            data: {
                title,
                content,
                imageUrl: imageUrl || null,
                createdById: userId,
            },
        });

        revalidatePath("/admin/observer-reports");
        return { success: true, report };
    } catch (error) {
        console.error("SubmitReport Error:", error);
        return { error: "Rapor gönderilemedi." };
    }
}

export async function getObserverReports() {
    const session = await verifySession();
    if (!["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        return { error: "Yetkisiz işlem" };
    }

    try {
        // Cleanup reports older than 14 days
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

        await db.observerReport.deleteMany({
            where: {
                createdAt: {
                    lt: fourteenDaysAgo
                }
            }
        });

        const reports = await db.observerReport.findMany({
            include: {
                createdBy: {
                    include: {
                        referee: true,
                        official: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return reports;
    } catch (error) {
        console.error("GetReports Error:", error);
        return { error: "Raporlar yüklenirken bir hata oluştu." };
    }
}

export async function getMyObserverReports() {
    const session = await verifySession();
    // Allow any logged in person to see their own reports if they have a role
    if (!session?.userId) {
        return { error: "Yetkisiz işlem" };
    }

    try {
        const reports = await db.observerReport.findMany({
            where: {
                createdById: session.userId
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return reports;
    } catch (error) {
        console.error("GetMyReports Error:", error);
        return { error: "Raporlarınız yüklenirken bir hata oluştu." };
    }
}

export async function deleteObserverReport(reportId: number) {
    const session = await verifySession();
    if (!["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        return { error: "Bu işlem için yetkiniz yok." };
    }

    try {
        await db.observerReport.delete({
            where: { id: reportId }
        });

        revalidatePath("/admin/observer-reports");
        return { success: true };
    } catch (error) {
        console.error("DeleteReport Error:", error);
        return { error: "Rapor silinirken bir hata oluştu." };
    }
}

