"use server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { isValidTurkishIBAN } from "@/lib/iban-validator";
import { put } from "@vercel/blob";
import { getAvailabilityWindow } from "@/lib/availability-utils";

export async function approveUser(userId: number) {
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
            "Hesabınız Onaylandı - Basketbol Koordinasyon Sistemi",
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
    firstName?: string;
    lastName?: string;
    classification?: string;
    officialType?: string;
    points?: number;
    rating?: number;
    regionIds?: number[];
    suspendedUntil?: Date | null;
    address?: string;
    iban?: string;
    email?: string;
    phone?: string;
}) {
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
        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.classification !== undefined) updateData.classification = data.classification;
        if (data.officialType !== undefined) updateData.officialType = data.officialType;
        if (data.points !== undefined) updateData.points = data.points;
        if (data.rating !== undefined) updateData.rating = data.rating;
        if (data.address !== undefined) updateData.address = data.address;

        if (data.email !== undefined) {
            const { formatEmail } = await import('@/lib/format-utils');
            const sanitizedEmail = formatEmail(data.email);
            if (!sanitizedEmail) {
                throw new Error("Geçersiz e-posta adresi formatı. Lütfen e-postayı doğru girdiğinizden emin olun (Örn: isim@ornek.com).");
            }
            updateData.email = sanitizedEmail;
        }

        if (data.phone !== undefined) {
            const { formatPhone } = await import('@/lib/format-utils');
            updateData.phone = formatPhone(data.phone);
        }

        if (data.iban !== undefined) {
            if (data.iban && !isValidTurkishIBAN(data.iban)) {
                throw new Error("Geçersiz IBAN formatı.");
            }
            updateData.iban = data.iban;
        }

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

    // Use availability window to get the current target Saturday
    const { startDate: currentStartDate } = await getAvailabilityWindow();

    // "Eski" = geçen haftadan da eski, yani currentStartDate - 7'den önce
    const lastWeekStart = new Date(currentStartDate);
    lastWeekStart.setDate(currentStartDate.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const deleteCount = await db.availabilityForm.deleteMany({
        where: {
            weekStartDate: {
                lt: lastWeekStart
            }
        }
    });

    revalidatePath("/admin/availability");
    revalidatePath("/admin/all-availabilities");
    return { success: true, count: deleteCount.count };
}

export async function cleanupCurrentAvailability() {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    // Use availability window to get the current target Saturday
    const { startDate: currentStartDate } = await getAvailabilityWindow();

    const rangeStart = new Date(currentStartDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(currentStartDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const deleteCount = await db.availabilityForm.deleteMany({
        where: {
            weekStartDate: {
                gte: rangeStart,
                lte: rangeEnd
            }
        }
    });

    revalidatePath("/admin/availability");
    revalidatePath("/admin/all-availabilities");
    return { success: true, count: deleteCount.count };
}

// Güncel haftanın formlarını geçen haftaya taşır (weekStartDate - 7 gün, günlük tarihleri de günceller)
export async function moveFormsToLastWeek() {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    const { startDate: currentStartDate } = await getAvailabilityWindow();

    const rangeStart = new Date(currentStartDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(currentStartDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(currentStartDate);
    lastWeekStart.setDate(currentStartDate.getDate() - 7);
    lastWeekStart.setHours(0, 0, 0, 0);

    const currentForms = await db.availabilityForm.findMany({
        where: {
            weekStartDate: {
                gte: rangeStart,
                lte: rangeEnd
            }
        },
        include: { days: true }
    });

    if (currentForms.length === 0) {
        return { success: true, count: 0 };
    }

    const ops: any[] = [];
    for (const form of currentForms) {
        ops.push(
            db.availabilityForm.update({
                where: { id: form.id },
                data: { weekStartDate: lastWeekStart }
            })
        );
        for (const day of form.days) {
            const newDate = new Date(day.date);
            newDate.setDate(newDate.getDate() - 7);
            ops.push(
                db.availabilityDay.update({
                    where: { id: day.id },
                    data: { date: newDate }
                })
            );
        }
    }
    await db.$transaction(ops);

    revalidatePath("/admin/availability");
    revalidatePath("/admin/all-availabilities");
    return { success: true, count: currentForms.length };
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


export async function addPenalty(userId: number, data: {
    type: string;
    reason: string;
    startDate: Date;
    endDate?: Date | null;
}) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    const penalty = await db.penalty.create({
        data: {
            userId,
            type: data.type,
            reason: data.reason,
            startDate: data.startDate,
            endDate: data.endDate || null,
            isActive: true
        }
    });

    // If type is SUSPENSION, also update user's suspendedUntil if the new date is further
    if (data.type === "SUSPENSION" && data.endDate) {
        const user = await db.user.findUnique({ where: { id: userId } });
        if (user && (!user.suspendedUntil || new Date(data.endDate) > new Date(user.suspendedUntil))) {
            await db.user.update({
                where: { id: userId },
                data: { suspendedUntil: data.endDate }
            });
        }
    }

    revalidatePath("/admin/referees");
    return { success: true, penalty };
}

export async function deletePenalty(penaltyId: number) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    const penalty = await db.penalty.findUnique({ where: { id: penaltyId } });
    if (!penalty) throw new Error("Ceza bulunamadı.");

    await db.penalty.delete({ where: { id: penaltyId } });

    revalidatePath("/admin/referees");
    return { success: true };
}

export async function removeUserAvatar(userId: number) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN_IHK" && session.role !== "ADMIN") {
        throw new Error("Yetkisiz işlem.");
    }

    try {
        const referee = await db.referee.findUnique({ where: { userId } });
        if (referee) {
            await db.referee.update({
                where: { userId },
                data: { imageUrl: null }
            });
        } else {
            const official = await db.generalOfficial.findUnique({ where: { userId } });
            if (official) {
                await db.generalOfficial.update({
                    where: { userId },
                    data: { imageUrl: null }
                });
            }
        }
        revalidatePath("/admin/referees");
        revalidatePath("/admin/officials");
        return { success: true };
    } catch (error) {
        console.error("Remove avatar error:", error);
        return { error: "Fotoğraf silinirken bir hata oluştu." };
    }
}

export async function updateAdminAvatar(formData: FormData) {
    const session = await verifySession();
    if (!session || !session.userId || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && session.role !== "ADMIN_IHK")) {
        return { error: "Yetkisiz işlem." };
    }

    const file = formData.get("file") as File;
    if (!file) return { error: "Dosya yüklenemedi." };

    try {
        const blob = await put(`avatars/admin-${session.userId}-${Date.now()}.jpg`, file, {
            access: 'public',
            contentType: 'image/jpeg',
        });

        await db.user.update({
            where: { id: session.userId },
            data: { imageUrl: blob.url }
        });

        revalidatePath("/admin/manage-admins");
        revalidatePath("/admin");
        return { success: true, url: blob.url };
    } catch (e: any) {
        console.error("Admin avatar upload error:", e);
        return { error: e.message || "Fotoğraf yüklenemedi." };
    }
}
