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
        include: { referee: true, official: true }
    });

    // Notify user via email (simplified logic)
    const profile = user.referee || user.official;
    if (profile?.email) {
        const { sendEmailSafe } = await import("@/lib/email");
        await sendEmailSafe(
            profile.email,
            "Hesabınız Onaylandı - TBF Hakem Sistemi",
            `<p>Sayın <strong>${profile.firstName} ${profile.lastName}</strong>,</p>
                     <p>Hesabınız yönetici tarafından onaylanmıştır. Artık sisteme giriş yapabilirsiniz.</p>`
        );
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
        await tx.generalOfficial.deleteMany({ where: { userId: userId } });
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

        // Update Profile fields
        const updateData: any = {};
        if (data.classification !== undefined) updateData.classification = data.classification;
        if (data.officialType !== undefined) updateData.officialType = data.officialType;
        if (data.points !== undefined) updateData.points = data.points;
        if (data.rating !== undefined) updateData.rating = data.rating;

        if (Object.keys(updateData).length > 0) {
            const referee = await tx.referee.findUnique({ where: { userId: userId }, include: { regions: true } });
            const generalOfficial = await tx.generalOfficial.findUnique({ where: { userId: userId }, include: { regions: true } });

            const isReferee = !!referee;
            const isOfficial = !!generalOfficial;

            // Target state
            const targetIsReferee = data.officialType === "REFEREE" || (isReferee && (data.officialType === undefined));

            if (isReferee && !targetIsReferee) {
                // MIGRATION: Referee -> GeneralOfficial
                const officialType = data.officialType || "TABLE"; // Default if somehow missing

                // 1. Create GeneralOfficial
                const newOfficial = await tx.generalOfficial.create({
                    data: {
                        userId: userId,
                        tckn: referee.tckn,
                        firstName: referee.firstName,
                        lastName: referee.lastName,
                        email: referee.email,
                        phone: referee.phone,
                        address: referee.address,
                        job: referee.job,
                        imageUrl: referee.imageUrl,
                        officialType,
                        points: data.points ?? referee.points,
                        rating: data.rating ?? referee.rating,
                        regions: {
                            connect: (data.regionIds ? data.regionIds.map((id: number) => ({ id })) : referee.regions.map((r: any) => ({ id: r.id })))
                        }
                    }
                });

                // 2. Transfer assignments and forms
                await tx.matchAssignment.updateMany({
                    where: { refereeId: referee.id },
                    data: { refereeId: null, officialId: newOfficial.id }
                });
                await tx.availabilityForm.updateMany({
                    where: { refereeId: referee.id },
                    data: { refereeId: null, officialId: newOfficial.id }
                });

                // 3. Delete Referee data (including exams via Cascade)
                await tx.referee.delete({ where: { id: referee.id } });

            } else if (isOfficial && targetIsReferee) {
                // MIGRATION: GeneralOfficial -> Referee
                const classification = data.classification || "BELIRLENMEMIS";

                // 1. Create Referee
                const newReferee = await tx.referee.create({
                    data: {
                        userId: userId,
                        tckn: generalOfficial.tckn,
                        firstName: generalOfficial.firstName,
                        lastName: generalOfficial.lastName,
                        email: generalOfficial.email,
                        phone: generalOfficial.phone,
                        address: generalOfficial.address,
                        job: generalOfficial.job,
                        imageUrl: generalOfficial.imageUrl,
                        classification,
                        points: data.points ?? generalOfficial.points,
                        rating: data.rating ?? generalOfficial.rating,
                        regions: {
                            connect: (data.regionIds ? data.regionIds.map((id: number) => ({ id })) : generalOfficial.regions.map((r: any) => ({ id: r.id })))
                        }
                    }
                });

                // 2. Transfer assignments and forms
                await tx.matchAssignment.updateMany({
                    where: { officialId: generalOfficial.id },
                    data: { officialId: null, refereeId: newReferee.id }
                });
                await tx.availabilityForm.updateMany({
                    where: { officialId: generalOfficial.id },
                    data: { officialId: null, refereeId: newReferee.id }
                });

                // 3. Delete GeneralOfficial
                await tx.generalOfficial.delete({ where: { id: generalOfficial.id } });

            } else if (isReferee) {
                // Normal Update for Referee
                const { officialType, ...refData } = updateData;
                await tx.referee.update({
                    where: { userId: userId },
                    data: {
                        ...refData,
                        ...(data.regionIds !== undefined ? {
                            regions: {
                                set: data.regionIds.map((id: number) => ({ id }))
                            }
                        } : {})
                    }
                });
            } else if (isOfficial) {
                // Normal Update for General Official
                const { classification, ...genData } = updateData;
                await tx.generalOfficial.update({
                    where: { userId: userId },
                    data: {
                        ...genData,
                        ...(data.regionIds !== undefined ? {
                            regions: {
                                set: data.regionIds.map((id: number) => ({ id }))
                            }
                        } : {})
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
                where: {
                    OR: [
                        { referee: { userId: userId } },
                        { official: { userId: userId } }
                    ]
                },
                select: { id: true }
            });
            const formIds = availFormIds.map((f: any) => f.id);
            if (formIds.length > 0) {
                await tx.availabilityDay.deleteMany({ where: { formId: { in: formIds } } });
                await tx.availabilityForm.deleteMany({ where: { id: { in: formIds } } });
            }

            // 2. Match Assignments
            await tx.matchAssignment.deleteMany({
                where: {
                    OR: [
                        { referee: { userId: userId } },
                        { official: { userId: userId } }
                    ]
                }
            });

            // 3. Exam Attempts
            await tx.userAnswer.deleteMany({
                where: {
                    attempt: {
                        referee: { userId: userId }
                    }
                }
            });
            await tx.examAttempt.deleteMany({
                where: {
                    referee: { userId: userId }
                }
            });

            // 4. Video Progress
            await tx.videoProgress.deleteMany({ where: { userId: userId } });

            // 5. Chat Sessions
            await tx.message.deleteMany({ where: { session: { userId: userId } } });
            await tx.chatSession.deleteMany({ where: { userId: userId } });

            // 6. Profiles
            await tx.referee.deleteMany({ where: { userId: userId } });
            await tx.generalOfficial.deleteMany({ where: { userId: userId } });

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

