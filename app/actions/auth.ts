"use server";

import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { TURKEY_CITIES } from "@/lib/constants";
import { logAction, ensureAuditLogTable } from "@/lib/logger";
import { LoginSchema, RegisterSchema, PasswordResetRequestSchema } from "@/lib/schemas";
import { validatePhone, formatPhone } from "@/lib/validation-utils";
import { z } from "zod";
import { randomBytes, randomInt } from "crypto";

// Cache to prevent redundant role checks in the same execution context
let isRolesChecked = false;

// Ensure required roles exist (no hardcoded users or passwords)
async function ensureRoles() {
    if (isRolesChecked) return;
    try {
        const requiredRoles = ['SUPER_ADMIN', 'ADMIN', 'ADMIN_IHK', 'REFEREE', 'USER'];
        for (const roleName of requiredRoles) {
            const existing = await db.role.findUnique({ where: { name: roleName } });
            if (!existing) {
                await db.role.create({ data: { name: roleName } });
            }
        }
    } catch (e) {
        console.warn("[ROLES] Ensure roles warning:", (e as any)?.message);
    } finally {
        isRolesChecked = true;
    }
}

export interface ActionState {
    error?: string;
    success: boolean;
    username?: string;
    message?: string;
    redirectTo?: string;
    requireVerification?: boolean;
    userId?: number;
    errors?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        password?: string;
        roleType?: string;
        job?: string;
        address?: string;
        iban?: string;
        kvkk?: string;
        securityQuestion?: string;
        securityAnswer?: string;
    };
}

export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
    // 0. Parse and Validate Input with Zod
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = LoginSchema.safeParse({
        ...rawData,
        adminLogin: formData.get("adminLogin") === "true"
    });

    if (!validatedFields.success) {
        return { error: "Geçersiz giriş bilgileri.", success: false };
    }

    const { identifier, password, adminLogin } = validatedFields.data;

    // 0.1 Rate Limiting Check
    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";

    let loginAttempt: any = null;
    try {
        loginAttempt = await db.loginAttempt.findUnique({
            where: { ipAddress: ip }
        });

        if (loginAttempt) {
            if (loginAttempt.blockedUntil && loginAttempt.blockedUntil > new Date()) {
                const minutesLeft = Math.ceil((loginAttempt.blockedUntil.getTime() - new Date().getTime()) / 60000);
                return { error: `Çok fazla başarısız deneme. Lütfen ${minutesLeft} dakika bekleyin.`, success: false };
            }
        }
    } catch (rateLimitError) {
        console.warn("[LOGIN] Rate limit DB check failed, skipping:", (rateLimitError as any)?.message);
    }


    await ensureRoles();
    await ensureAuditLogTable();

    try {
        // 1. Find user by email (or username as fallback for old accounts)
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { referee: { email: { equals: identifier, mode: 'insensitive' } } },
                    { official: { email: { equals: identifier, mode: 'insensitive' } } }
                ]
            },
            include: {
                role: true,
                referee: true,
                official: true
            }
        }) as any;

        // to prevent account enumeration
        const genericError = "Giriş bilgileri hatalı. Lütfen kontrol ederek tekrar deneyiniz.";

        if (!user) {
            if (process.env.NODE_ENV !== "production") console.log("[LOGIN_DEBUG] User NOT found for identifier:", identifier);
            await handleFailedLogin(ip, loginAttempt);
            return { error: genericError, success: false };
        }

        if (process.env.NODE_ENV !== "production") console.log("[LOGIN_DEBUG] User found:", user.id, "username:", user.username, "role:", user.role?.name, "isApproved:", user.isApproved, "isActive:", user.isActive);

        // 1.5 Access Checks
        const roleName = (user.role?.name || "").toUpperCase();
        const isAdminUser = roleName.includes("ADMIN");

        if (!user.isApproved && !isAdminUser) {
            return { error: "Hesabınız henüz onaylanmamıştır. Lütfen yöneticinin onaylamasını bekleyin.", success: false };
        }

        if (!user.isActive && !isAdminUser) {
            return { error: "Hesabınız pasif konumdadır. Lütfen yönetici ile iletişime geçin.", success: false };
        }

        // 1.6 Suspension Check
        if (user.suspendedUntil && user.suspendedUntil > new Date()) {
            const dateStr = user.suspendedUntil.toLocaleDateString('tr-TR');
            return { error: `Hesabınız ${dateStr} tarihine kadar askıya alınmıştır.`, success: false };
        }

        // 1.7 Path Validation
        if (adminLogin && user.role.name !== "SUPER_ADMIN" && user.role.name !== "ADMIN_IHK" && user.role.name !== "ADMIN") {
            return { error: "Bu panelden giriş yetkiniz bulunmamaktadır.", success: false };
        }

        // 2. Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log("[LOGIN_DEBUG] Password INVALID for user:", user.id, user.username);
            await handleFailedLogin(ip, loginAttempt);
            return { error: genericError, success: false };
        }

        if (process.env.NODE_ENV !== "production") console.log("[LOGIN_DEBUG] Password VALID, proceeding to create session.");

        // Success - Cleanup rate limit
        if (loginAttempt) {
            await db.loginAttempt.delete({ where: { ipAddress: ip } });
        }

        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        await logAction(user.id, "LOGIN_SUCCESS", `User ${user.username} logged in successfully.`);

        const rememberMe = formData.get("remember") === "on";


        // 2FA Logic for Referees and Officials
        // Skip 2FA for SUPER_ADMIN
        if (roleName === "SUPER_ADMIN") {
            await createSession(user.id, user.role.name, rememberMe);
            return { success: true, redirectTo: "/admin" };
        }

        // 2FA bypass for dev environment only
        const is2FADisabled = process.env.NODE_ENV !== "production" && process.env.DISABLE_2FA === "true";

        if (is2FADisabled) {
            await createSession(user.id, user.role.name, rememberMe);
            let redirectTo = "/";
            if (roleName === "ADMIN" || roleName === "SUPER_ADMIN" || roleName === "ADMIN_IHK") {
                redirectTo = "/admin";
            } else if (user.official) {
                redirectTo = "/general";
            } else if (user.referee) {
                redirectTo = "/referee";
            }
            return { success: true, redirectTo };
        }

        const code = randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await db.user.update({
            where: { id: user.id },
            data: {
                verificationCode: code,
                verificationCodeExpiresAt: expiresAt
            }
        });

        // Send Email
        const recipientEmail = user.referee?.email || (user as any).official?.email;
        if (recipientEmail) {
            try {
                const { sendVerificationEmail } = await import("@/lib/email");
                await sendVerificationEmail(recipientEmail, code);
            } catch (emailError) {
                console.error("2FA Email error:", emailError);
            }
        }

        return { success: false, requireVerification: true, userId: user.id, error: undefined };

    } catch (error: any) {
        console.error("Login system error:", error);
        return { error: "Sistemde bir hata oluştu. Lütfen daha sonra tekrar deneyiniz.", success: false };
    }
}

export async function verify2FA(userId: number, code: string): Promise<ActionState> {
    if (!userId || !code) return { error: "Geçersiz istek.", success: false };

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { role: true, referee: true, official: true }
        }) as any;

        if (!user) return { error: "Kullanıcı bulunamadı.", success: false };

        if (user.verificationCode !== code) {
            return { error: "Hatalı doğrulama kodu.", success: false };
        }

        if (!user.verificationCodeExpiresAt || user.verificationCodeExpiresAt < new Date()) {
            return { error: "Doğrulama kodunun süresi dolmuş. Lütfen tekrar giriş yapın.", success: false };
        }

        // Clear code and mark verified
        await db.user.update({
            where: { id: user.id },
            data: {
                verificationCode: null,
                verificationCodeExpiresAt: null,
                isVerified: true
            }
        });

        // Create Session
        const rememberMe = false; // We might need to handle this for 2FA too, but user didn't specify. 
        // Typically it's better to pass it through or store it temporarily.
        await createSession(user.id, user.role.name, rememberMe);

        // Redirect
        let redirectTo = "/";
        if (user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN" || user.role.name === "ADMIN_IHK") {
            redirectTo = "/admin";
        } else if (user.official) {
            redirectTo = "/general";
        } else if (user.referee) {
            redirectTo = "/referee";
        }

        return { success: true, redirectTo };
    } catch (e: any) {
        console.error("Verify2FA error:", e);
        return { error: "Doğrulama hatası. Lütfen tekrar deneyiniz.", success: false };
    }
}

export async function register(prevState: ActionState, formData: FormData): Promise<ActionState> {
    // 0. Parse and Validate Input with Zod
    const rawData = Object.fromEntries(formData.entries());
    const validatedFields = RegisterSchema.safeParse({
        ...rawData,
        kvkk: formData.get("kvkk") === "on" // Checkbox standard
    });

    if (!validatedFields.success) {
        const fieldErrors = validatedFields.error.flatten().fieldErrors;
        const mappedErrors: NonNullable<ActionState['errors']> = {};

        (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).forEach(key => {
            const errorMsg = fieldErrors[key]?.[0];
            if (errorMsg) {
                (mappedErrors as any)[key] = errorMsg;
            }
        });

        return { error: "Lütfen işaretli alanları kontrol edin.", errors: mappedErrors, success: false };
    }

    const { firstName, lastName, email, phone, password, roleType, job, address, iban, securityQuestion, securityAnswer } = validatedFields.data;



    const { formatEmail } = await import('@/lib/format-utils');
    const sanitizedEmail = formatEmail(email);

    if (!sanitizedEmail) {
        return { error: "Geçersiz e-posta adresi formatı. Lütfen e-postayı doğru girdiğinizden emin olun (Örn: isim@ornek.com).", errors: { email: "Geçersiz format" }, success: false };
    }

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Check existing user (Email)

        const existingRefereeEmail = await db.referee.findUnique({ where: { email: sanitizedEmail } });
        const existingOfficialEmail = await db.generalOfficial.findUnique({ where: { email: sanitizedEmail } });

        if (existingRefereeEmail || existingOfficialEmail) {
            return { error: "Bu E-posta zaten kullanımda.", errors: { email: "Zaten kayıtlı." }, success: false };
        }

        // 3. Find/Create Role
        let refereeRole = await db.role.findUnique({ where: { name: "REFEREE" } });
        if (!refereeRole) {
            refereeRole = await db.role.create({ data: { name: "REFEREE" } });
        }

        const selectedCity = formData.get("selectedCity") as string || "İstanbul";

        // 4. Transactional Create
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await db.$transaction(async (tx: any) => {
            const createdUser = await tx.user.create({
                data: {
                    username: sanitizedEmail,
                    password: hashedPassword,
                    roleId: refereeRole!.id,
                    isApproved: false,
                    isVerified: false,
                    verificationCode: token,
                    verificationCodeExpiresAt: expiresAt,
                    securityQuestion,
                    securityAnswer
                }
            });

            let region = await tx.region.findUnique({ where: { name: selectedCity } });
            if (!region) {
                region = await tx.region.create({ data: { name: selectedCity } });
            }

            if (roleType === "REFEREE") {
                await tx.referee.create({
                    data: {
                        userId: createdUser.id,
                        firstName,
                        lastName,
                        email: sanitizedEmail,
                        phone: formatPhone(phone),
                        classification: 'BELIRLENMEMIS',
                        job: job || null,
                        address: address || null,
                        iban: iban || null,
                        regions: { connect: { id: region.id } }
                    }
                });
            } else {
                await tx.generalOfficial.create({
                    data: {
                        userId: createdUser.id,
                        firstName,
                        lastName,
                        email: sanitizedEmail,
                        phone: formatPhone(phone),
                        officialType: roleType,
                        job: job || null,
                        address: address || null,
                        iban: iban || null,
                        regions: { connect: { id: region.id } }
                    }
                });
            }
        });

        // 5. Send Verification Email
        try {
            const { sendEmailVerificationLink } = await import("@/lib/email");
            const host = (await headers()).get("host") || "localhost:3000";
            const protocol = host.includes("localhost") ? "http" : "https";
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
            const verificationUrl = `${appUrl}/verify-email?token=${token}&type=register`;

            await sendEmailVerificationLink(sanitizedEmail, verificationUrl);
        } catch (emailError) {
            console.error("Register verification email error:", emailError);
            // We still return success because user is created, but warn them
        }

        return {
            success: true,
            username: sanitizedEmail,
            message: "Yönetici Onayına Gönderildi."
        };

    } catch (error: any) {
        console.error("Critical Register Error:", error);
        return { error: "Kayıt işlemi sırasında bir hata oluştu.", success: false };
    }
}

export async function createAdmin(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const roleName = (formData.get("role") as string) || "ADMIN";

    if (!email || !password) {
        return { error: "Lütfen E-posta ve şifre giriniz.", success: false };
    }

    try {
        const session = await import("@/lib/session");
        const currentSession = await session.getSession();
        if (currentSession?.role !== "SUPER_ADMIN") {
            return { error: "Yetkisiz işlem.", success: false };
        }

        const existingUser = await db.user.findUnique({ where: { username: email } });
        if (existingUser) {
            return { error: "Bu E-posta ile kayıtlı bir kullanıcı zaten var.", success: false };
        }

        // Validate role selection
        if (roleName !== "ADMIN" && roleName !== "SUPER_ADMIN") {
            return { error: "Geçersiz rol seçimi.", success: false };
        }

        let targetRole = await db.role.findUnique({ where: { name: roleName } });
        if (!targetRole) {
            targetRole = await db.role.create({ data: { name: roleName } });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.create({
            data: {
                username: email,
                password: hashedPassword,
                roleId: targetRole.id,
                isApproved: true,
                isVerified: true
            }
        });

        revalidatePath("/admin/manage-admins");
        return { success: true, message: "Yönetici başarıyla oluşturuldu." };
    } catch (error) {
        console.error("Create Admin error:", error);
        return { error: "Yönetici oluşturulurken bir hata oluştu.", success: false };
    }
}

export async function deleteAdmin(userId: number) {
    try {
        const session = await import("@/lib/session");
        const currentSession = await session.getSession();

        if (currentSession?.role !== "SUPER_ADMIN") {
            throw new Error("Yetkisiz işlem.");
        }

        // Prevent deleting yourself
        if (currentSession.userId === userId) {
            throw new Error("Kendi hesabınızı silemezsiniz.");
        }

        const userToDelete = await db.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        if (!userToDelete) {
            throw new Error("Kullanıcı bulunamadı.");
        }

        // Safety check: Don't allow deleting other SUPER_ADMINs if needed, 
        // or at least require caution. The user asked for double click anyway.
        // We'll allow it if they are SUPER_ADMIN, as they are the boss.

        await db.user.delete({
            where: { id: userId }
        });

        revalidatePath("/admin/manage-admins");
        return { success: true };
    } catch (error: any) {
        console.error("Delete Admin error:", error);
        return { error: error.message || "Silme işlemi sırasında bir hata oluştu." };
    }
}

export async function promoteToAdmin(userId: number) {
    try {
        const session = await import("@/lib/session");
        const currentSession = await session.getSession();

        if (!currentSession) {
            return { error: "Yetkisiz işlem. Oturum bulunamadı." };
        }

        if (currentSession.role !== "SUPER_ADMIN") {
            return { error: "Yetkisiz işlem. Sadece Süper Admin bu işlemi yapabilir." };
        }

        const userToPromote = await db.user.findUnique({
            where: { id: userId },
            include: { role: true, referee: true }
        });

        if (!userToPromote) return { error: "Kullanıcı bulunamadı." };

        // Check if it's an Observer (Gözlemci) or Referee (Hakem)
        const official = await db.generalOfficial.findUnique({ where: { userId: userId } });
        const referee = await db.referee.findUnique({ where: { userId: userId } });

        if (official?.officialType !== "OBSERVER" && !referee) {
            return { error: "Sadece Gözlemciler (OBSERVER) ve Hakemler yöneticiye dönüştürülebilir." };
        }

        let adminRole = await db.role.findUnique({ where: { name: "ADMIN" } });
        if (!adminRole) {
            adminRole = await db.role.create({ data: { name: "ADMIN" } });
        }

        await db.user.update({
            where: { id: userId },
            data: {
                roleId: adminRole.id,
                isApproved: true,
                isVerified: true,
                forceRefresh: true
            }
        });

        // Resolve target user's name for audit log
        const targetProfile = await db.referee.findUnique({ where: { userId } }) ||
            await db.generalOfficial.findUnique({ where: { userId } });
        const targetName = targetProfile ? `${targetProfile.firstName} ${targetProfile.lastName}` : `ID:${userId}`;

        await logAction(currentSession.userId, "PROMOTE_TO_ADMIN", `${targetName} kullanıcısı ADMIN olarak yükseltildi.`, userId);

        revalidatePath("/admin/manage-admins");
        revalidatePath("/admin/officials");
        return { success: true, message: "Kullanıcı başarıyla yönetici yapıldı." };
    } catch (error) {
        console.error("Promote to Admin error:", error);
        return { error: "İşlem sırasında bir hata oluştu." };
    }
}

export async function demoteFromAdmin(userId: number) {
    try {
        const session = await import("@/lib/session");
        const currentSession = await session.getSession();

        if (!currentSession) {
            return { error: "Yetkisiz işlem. Oturum bulunamadı." };
        }

        if (currentSession.role !== "SUPER_ADMIN") {
            return { error: "Yetkisiz işlem. Sadece Süper Admin bu işlemi yapabilir." };
        }

        const userToDemote = await db.user.findUnique({
            where: { id: userId },
            include: { role: true }
        });

        if (!userToDemote) return { error: "Kullanıcı bulunamadı." };

        let userRole = await db.role.findUnique({ where: { name: "USER" } });
        if (!userRole) {
            userRole = await db.role.create({ data: { name: "USER" } });
        }

        await db.user.update({
            where: { id: userId },
            data: {
                roleId: userRole.id,
                forceRefresh: true
            }
        });

        // Resolve target user's name for audit log
        const targetProfile = await db.referee.findUnique({ where: { userId } }) ||
            await db.generalOfficial.findUnique({ where: { userId } });
        const targetName = targetProfile ? `${targetProfile.firstName} ${targetProfile.lastName}` : `ID:${userId}`;

        await logAction(currentSession.userId, "DEMOTE_FROM_ADMIN", `${targetName} kullanıcısının ADMIN yetkisi kaldırıldı.`, userId);

        revalidatePath("/admin/manage-admins");
        revalidatePath("/admin/officials");
        revalidatePath("/admin/referees");
        return { success: true, message: "Yöneticilik yetkisi başarıyla geri alındı." };
    } catch (error) {
        console.error("Demote from Admin error:", error);
        return { error: "İşlem sırasında bir hata oluştu." };
    }
}

export async function toggleUserActiveStatus(userId: number) {
    try {
        const session = await import("@/lib/session");
        const currentSession = await session.getSession();

        const allowedRoles = ["ADMIN", "SUPER_ADMIN"];
        if (!allowedRoles.includes(currentSession?.role || "")) {
            return { error: "Yetkisiz işlem." };
        }

        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) return { error: "Kullanıcı bulunamadı." };

        await db.user.update({
            where: { id: userId },
            data: { isActive: !(user as any).isActive } as any
        });

        revalidatePath("/admin/manage-admins");
        revalidatePath("/admin/referees");
        revalidatePath("/admin/officials");
        return { success: true, message: `Kullanıcı durumu ${!(user as any).isActive ? 'Aktif' : 'Pasif'} olarak güncellendi.` };
    } catch (error) {
        console.error("Toggle User Activity error:", error);
        return { error: "İşlem sırasında bir hata oluştu." };
    }
}

export async function logout() {
    await deleteSession();
    redirect("/");
}

export async function requestPasswordReset(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const identifier = (formData.get("identifier") as string || "").trim();
    if (!identifier) return { error: "Lütfen E-posta adresinizi giriniz.", success: false };

    // Ensure database columns exist before proceeding


    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { referee: { email: { equals: identifier, mode: 'insensitive' } } },
                    { official: { email: { equals: identifier, mode: 'insensitive' } } }
                ]
            },
            include: { referee: true, official: true }
        });

        // Security: Don't reveal whether account exists to prevent enumeration
        if (!user) {
            return { success: true, message: "Eğer bu e-posta ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderilecektir." };
        }

        const email = user.referee?.email || user.official?.email || user.username;
        if (!email) {
            return { error: "Hesabınıza tanımlı bir e-posta adresi bulunamadı. Lütfen yönetici ile iletişime geçin.", success: false };
        }

        // Generate a random 32-char hex token
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await db.user.update({
            where: { id: user.id },
            data: {
                resetPasswordCode: token,
                resetPasswordExpiresAt: expiresAt
            }
        });

        await logAction(user.id, "PASSWORD_RESET_REQUESTED", "User requested password reset.");

        // Send Email
        const { sendPasswordResetEmail } = await import("@/lib/email");

        // Dynamically determine the app URL from headers if NEXT_PUBLIC_APP_URL is not set
        let appUrl = process.env.NEXT_PUBLIC_APP_URL;
        if (!appUrl) {
            const host = (await headers()).get("host") || "localhost:3000";
            const protocol = host.includes("localhost") ? "http" : "https";
            appUrl = `${protocol}://${host}`;
        }

        const resetUrl = `${appUrl}/reset-password?token=${token}`;

        const emailSent = await sendPasswordResetEmail(email, resetUrl);
        if (!emailSent) {
            return { error: "Şifre sıfırlama e-postası gönderilirken bir hata oluştu.", success: false };
        }

        return { success: true, message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderilmiştir. Lütfen gelen kutunuzu kontrol edin." };
    } catch (e: any) {
        console.error("Reset request error:", e);
        return { error: "İşlem sırasında bir hata oluştu.", success: false };
    }
}

export async function resetPassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;

    if (!token) return { error: "Geçersiz şifre sıfırlama isteği.", success: false };
    if (!password || password.length < 6) return { error: "Şifre en az 6 karakter olmalıdır.", success: false };
    if (password !== passwordConfirm) return { error: "Şifreler eşleşmiyor.", success: false };

    // Ensure database columns exist before proceeding


    try {
        const user = await db.user.findFirst({
            where: {
                resetPasswordCode: token,
                resetPasswordExpiresAt: {
                    gt: new Date()
                }
            }
        });

        if (!user) {
            return { error: "Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş.", success: false };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordCode: null,
                resetPasswordExpiresAt: null,
                // Also clear any 2FA codes for security
                verificationCode: null,
                verificationCodeExpiresAt: null
            }
        });

        await logAction(user.id, "PASSWORD_RESET_SUCCESS", "User successfully reset their password.");

        return { success: true, message: "Şifreniz başarıyla güncellendi. Yeni şifrenizle giriş yapabilirsiniz." };
    } catch (e: any) {
        console.error("Reset password error:", e);
        return { error: "Şifre güncellenirken bir hata oluştu.", success: false };
    }
}

async function handleFailedLogin(ip: string, loginAttempt: any) {
    const now = new Date();
    if (!loginAttempt) {
        await db.loginAttempt.create({
            data: {
                ipAddress: ip,
                attempts: 1,
                lastAttempt: now
            }
        });
    } else {
        const newAttempts = loginAttempt.attempts + 1;
        let blockedUntil: Date | null = null;

        // Escalating block durations for bot protection
        if (newAttempts >= 20) {
            blockedUntil = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
        } else if (newAttempts >= 15) {
            blockedUntil = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        } else if (newAttempts >= 10) {
            blockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
        } else if (newAttempts >= 5) {
            blockedUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
        }

        await db.loginAttempt.update({
            where: { ipAddress: ip },
            data: {
                attempts: newAttempts,
                lastAttempt: now,
                blockedUntil: blockedUntil
            }
        });
    }
}

export async function verifyEmailAction(token: string, type: string): Promise<{ success: boolean; error?: string }> {
    if (!token) return { success: false, error: "Geçersiz doğrulama bağlantısı." };

    try {
        const user = await db.user.findFirst({
            where: {
                verificationCode: token,
                verificationCodeExpiresAt: {
                    gt: new Date()
                }
            },
            include: {
                referee: true,
                official: true
            }
        }) as any;

        if (!user) {
            return { success: false, error: "Doğrulama bağlantısı geçersiz veya süresi dolmuş." };
        }

        if (type === 'register') {
            await db.user.update({
                where: { id: user.id },
                data: {
                    isVerified: true,
                    verificationCode: null,
                    verificationCodeExpiresAt: null
                }
            });
            await logAction(user.id, "EMAIL_VERIFIED_REGISTER", "User verified their email after registration.");
        } else if (type === 'change') {
            if (!user.pendingEmail) {
                return { success: false, error: "Değiştirilecek bekleyen bir e-posta adresi bulunamadı." };
            }

            const newEmail = user.pendingEmail;

            // Transact the email update across tables
            await db.$transaction(async (tx: any) => {
                await tx.user.update({
                    where: { id: user.id },
                    data: {
                        pendingEmail: null,
                        verificationCode: null,
                        verificationCodeExpiresAt: null
                    }
                });

                if (user.referee) {
                    await tx.referee.update({
                        where: { userId: user.id },
                        data: { email: newEmail }
                    });
                } else if (user.official) {
                    await tx.generalOfficial.update({
                        where: { userId: user.id },
                        data: { email: newEmail }
                    });
                }
            });

            await logAction(user.id, "EMAIL_VERIFIED_CHANGE", `User updated their email to ${newEmail}`);
        }

        return { success: true };
    } catch (error) {
        console.error("verifyEmailAction error:", error);
        return { success: false, error: "Doğrulama işlemi sırasında bir hata oluştu." };
    }
}

export async function getUserSecurityQuestion(identifier: string) {
    if (!identifier) return { error: "Lütfen kullanıcı adı veya e-posta giriniz." };
    
    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { referee: { email: { equals: identifier, mode: 'insensitive' } } },
                    { official: { email: { equals: identifier, mode: 'insensitive' } } }
                ]
            }
        });

        if (!user) return { error: "Kullanıcı bulunamadı." };
        if (!user.securityQuestion) return { error: "Hesabınıza tanımlı bir güvenlik sorusu bulunamadı. Lütfen e-posta ile sıfırlamayı deneyin." };

        return { success: true, question: user.securityQuestion };
    } catch (error) {
        console.error("getUserSecurityQuestion error:", error);
        return { error: "Sistemde bir hata oluştu." };
    }
}

export async function resetPasswordWithSecurityQuestion(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const identifier = formData.get("identifier") as string;
    const answer = formData.get("answer") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;

    if (!identifier || !answer || !password) return { error: "Lütfen tüm alanları doldurun.", success: false };
    if (password.length < 6) return { error: "Şifre en az 6 karakter olmalıdır.", success: false };
    if (password !== passwordConfirm) return { error: "Şifreler eşleşmiyor.", success: false };

    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { referee: { email: { equals: identifier, mode: 'insensitive' } } },
                    { official: { email: { equals: identifier, mode: 'insensitive' } } }
                ]
            }
        });

        if (!user) return { error: "Kullanıcı bulunamadı.", success: false };
        
        if (!user.securityAnswer || user.securityAnswer.toLowerCase().trim() !== answer.toLowerCase().trim()) {
            return { error: "Güvenlik sorusu cevabı hatalı.", success: false };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordCode: null,
                resetPasswordExpiresAt: null,
                verificationCode: null,
                verificationCodeExpiresAt: null
            }
        });

        await logAction(user.id, "PASSWORD_RESET_SQ_SUCCESS", "User reset password via security question.");

        return { success: true, message: "Şifreniz başarıyla güncellendi." };
    } catch (error) {
        console.error("resetPasswordWithSecurityQuestion error:", error);
        return { error: "Sistemde bir hata oluştu.", success: false };
    }
}

export async function resetPasswordWithRecoveryCode(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const identifier = (formData.get("identifier") as string || "").trim();
    const recoveryCode = (formData.get("recoveryCode") as string || "").trim();
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;

    if (!identifier || !recoveryCode || !password) return { error: "Lütfen tüm alanları doldurun.", success: false };
    if (password.length < 6) return { error: "Şifre en az 6 karakter olmalıdır.", success: false };
    if (password !== passwordConfirm) return { error: "Şifreler eşleşmiyor.", success: false };

    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { referee: { email: { equals: identifier, mode: 'insensitive' } } },
                    { official: { email: { equals: identifier, mode: 'insensitive' } } }
                ]
            }
        });

        if (!user) return { error: "Kullanıcı bulunamadı.", success: false };
        
        if (!user.recoveryCode || user.recoveryCode !== recoveryCode) {
            // Log failed recovery attempt? (Optional)
            return { error: "Kurtarma kodu hatalı. Lütfen kontrol ediniz.", success: false };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetPasswordCode: null,
                resetPasswordExpiresAt: null,
                verificationCode: null,
                verificationCodeExpiresAt: null
            }
        });

        await logAction(user.id, "PASSWORD_RESET_RC_SUCCESS", "User reset password via recovery code.");

        return { success: true, message: "Şifreniz başarıyla güncellendi." };
    } catch (error) {
        console.error("resetPasswordWithRecoveryCode error:", error);
        return { error: "Sistemde bir hata oluştu.", success: false };
    }
}

