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
import { validateTCKN, validatePhone, formatPhone } from "@/lib/validation-utils";
import { z } from "zod";

// Cache to prevent redundant schema checks in the same execution context
let isSchemaChecked = false;

// Self-healing helper to add missing columns if they don't exist
export async function ensureSchemaColumns() {
    if (isSchemaChecked) return;
    try {
        // Users table (mapped as users)
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationCode" TEXT`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationCodeExpiresAt" TIMESTAMP`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetPasswordCode" TEXT`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetPasswordExpiresAt" TIMESTAMP`);

        // Referees table (mapped as referees)
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "address" TEXT`);
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "job" TEXT`);
        // Removed officialType from referees table in schema
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "points" INTEGER DEFAULT 0`);
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 0`);

        // Seed Roles and Admin User at runtime if missing
        const superAdminRole = await db.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
        if (!superAdminRole) {
            await db.role.create({ data: { name: 'SUPER_ADMIN' } });
        }

        // Seed City-based Regions
        const currentRegionCount = await db.region.count();
        if (currentRegionCount < 81) {
            await db.region.deleteMany({
                where: {
                    name: {
                        in: ["Avrupa", "Asya", "BGM", "Anadolu", "İl Hakemi", "Aday Hakem"]
                    }
                }
            });

            for (const cityName of TURKEY_CITIES) {
                await db.region.upsert({
                    where: { name: cityName },
                    update: {},
                    create: { name: cityName }
                });
            }
        }

        const adminUsername = 'talat.mustafa.ozdemir50';
        const existingAdmin = await db.user.findUnique({ where: { username: adminUsername } });
        if (!existingAdmin) {
            const adminRole = await db.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
            if (adminRole) {
                const initialPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin123!Secure";
                const hashedPassword = await bcrypt.hash(initialPassword, 10);
                await db.user.create({
                    data: {
                        username: adminUsername,
                        tckn: '11111111111',
                        password: hashedPassword,
                        roleId: adminRole.id,
                        isApproved: true,
                        isVerified: true
                    }
                });
                console.log("[DB-FIX] Super Admin created successfully.");
            }
        }
    } catch (e) {
        // Silently fail if columns exist or other DB issues
        console.warn("[DB-FIX] Self-healing attempt finished with warning:", (e as any)?.message);
    } finally {
        isSchemaChecked = true;
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
        tckn?: string;
        email?: string;
        phone?: string;
        password?: string;
        roleType?: string;
        job?: string;
        address?: string;
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

    let loginAttempt = null;
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

    await ensureSchemaColumns();
    await ensureAuditLogTable();

    try {
        // 1. Find user (TCKN must be exact, Username is case-insensitive)
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { tckn: identifier },
                ],
            },
            include: {
                role: true,
                referee: true,
                official: true
            }
        }) as any;

        // SECURITY: Common error message for both "User Not Found" and "Wrong Password" 
        // to prevent account enumeration (guessing registered TCKNs).
        const genericError = "Giriş bilgileri hatalı. Lütfen kontrol ederek tekrar deneyiniz.";

        if (!user) {
            await handleFailedLogin(ip, loginAttempt);
            return { error: genericError, success: false };
        }

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
            await handleFailedLogin(ip, loginAttempt);
            return { error: genericError, success: false };
        }

        // Success - Cleanup rate limit
        if (loginAttempt) {
            await db.loginAttempt.delete({ where: { ipAddress: ip } });
        }

        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        await logAction(user.id, "LOGIN_SUCCESS", `User ${user.username} logged in successfully.`);

        // ADMIN BYPASS: Allow admins to login without 2FA
        if (isAdminUser || roleName === "SUPER_ADMIN") {
            await createSession(user.id, user.role.name);
            return { success: true, redirectTo: "/admin", error: undefined };
        }

        // 2FA Logic for Referees and Officials
        const code = Math.floor(100000 + Math.random() * 900000).toString();
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
        await createSession(user.id, user.role.name);

        // Redirect
        let redirectTo = "/";
        if (user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN" || user.role.name === "ADMIN_IHK") {
            redirectTo = "/admin";
        } else if (user.referee) {
            redirectTo = "/referee";
        } else if ((user as any).official) {
            redirectTo = "/general";
        }

        return { success: true, redirectTo };
    } catch (e) {
        console.error(e);
        return { error: "Doğrulama hatası.", success: false };
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

    const { firstName, lastName, tckn, email, phone, password, roleType, job, address } = validatedFields.data;

    await ensureSchemaColumns();

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Check existing user (TCKN/Email)
        const existingTckn = await db.user.findFirst({ where: { tckn } });
        if (existingTckn) {
            return { error: "Bu TCKN ile kayıtlı bir kullanıcı zaten var.", errors: { tckn: "Zaten kayıtlı." }, success: false };
        }

        const existingRefereeEmail = await db.referee.findUnique({ where: { email } });
        const existingOfficialEmail = await db.generalOfficial.findUnique({ where: { email } });

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
        await db.$transaction(async (tx: any) => {
            const createdUser = await tx.user.create({
                data: {
                    username: tckn,
                    tckn: tckn,
                    password: hashedPassword,
                    roleId: refereeRole!.id,
                    isApproved: false
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
                        tckn: tckn,
                        firstName,
                        lastName,
                        email,
                        phone: formatPhone(phone),
                        classification: 'BELIRLENMEMIS',
                        job: job || null,
                        address: address || null,
                        regions: { connect: { id: region.id } }
                    }
                });
            } else {
                await tx.generalOfficial.create({
                    data: {
                        userId: createdUser.id,
                        tckn: tckn,
                        firstName,
                        lastName,
                        email,
                        phone: formatPhone(phone),
                        officialType: roleType,
                        job: job || null,
                        address: address || null,
                        regions: { connect: { id: region.id } }
                    }
                });
            }
        });

        return {
            success: true,
            username: tckn,
            message: "Kayıt başarılı! Başvurunuz Yönetici tarafından onay beklemektedir."
        };

    } catch (error: any) {
        console.error("Critical Register Error:", error);
        return { error: "Kayıt işlemi sırasında bir hata oluştu.", success: false };
    }
}

export async function createAdmin(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const tckn = formData.get("tckn") as string;
    const password = formData.get("password") as string;
    const roleName = (formData.get("role") as string) || "ADMIN";

    if (!tckn || !password) {
        return { error: "Lütfen TCKN ve şifre giriniz.", success: false };
    }

    if (tckn.length !== 11) {
        return { error: "TCKN 11 haneli olmalıdır.", success: false };
    }

    try {
        const session = await import("@/lib/session");
        const currentSession = await session.getSession();
        if (currentSession?.role !== "SUPER_ADMIN") {
            return { error: "Yetkisiz işlem.", success: false };
        }

        const existingUser = await db.user.findUnique({ where: { tckn } });
        if (existingUser) {
            return { error: "Bu TCKN ile kayıtlı bir kullanıcı zaten var.", success: false };
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
                username: tckn,
                tckn: tckn,
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

        if (currentSession?.role !== "SUPER_ADMIN") {
            return { error: "Yetkisiz işlem. Sadece Süper Admin bu işlemi yapabilir." };
        }

        const userToPromote = await db.user.findUnique({
            where: { id: userId },
            include: { role: true, referee: true }
        });

        if (!userToPromote) return { error: "Kullanıcı bulunamadı." };

        // Check if it's an Observer (Gözlemci)
        const official = await db.generalOfficial.findUnique({ where: { userId: userId } });
        if (official?.officialType !== "OBSERVER") {
            return { error: "Sadece Gözlemciler (OBSERVER) yöneticiye dönüştürülebilir." };
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
                isVerified: true
            }
        });

        await logAction(currentSession.userId, "PROMOTE_TO_ADMIN", `Promoted user ${userId} to ADMIN`, userId);

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

        if (currentSession?.role !== "SUPER_ADMIN") {
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
                roleId: userRole.id
            }
        });

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
    if (!identifier) return { error: "Lütfen TCKN veya kullanıcı adı giriniz.", success: false };

    // Ensure database columns exist before proceeding
    await ensureSchemaColumns();

    try {
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { tckn: identifier }
                ]
            },
            include: { referee: true }
        });

        // Security: Direct feedback requested by user
        if (!user) {
            // Log attempt nonetheless for security monitoring
            return { error: "Bu TCKN veya kullanıcı adı ile kayıtlı bir hesap bulunamadı.", success: false };
        }

        const email = user.referee?.email;
        if (!email) {
            return { error: "Hesabınıza tanımlı bir e-posta adresi bulunamadı. Lütfen yönetici ile iletişime geçin.", success: false };
        }

        // Generate a random 32-char hex token
        const token = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
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
    await ensureSchemaColumns();

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
        let blockedUntil = null;
        if (newAttempts >= 5) {
            blockedUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes block
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
