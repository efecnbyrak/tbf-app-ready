"use server";

import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// Self-healing helper to add missing columns if they don't exist
export async function ensureSchemaColumns() {
    try {
        // Users table (mapped as users)
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false`);
        await db.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP`);

        // Referees table (mapped as referees)
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "address" TEXT`);
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "job" TEXT`);
        await db.$executeRawUnsafe(`ALTER TABLE referees ADD COLUMN IF NOT EXISTS "officialType" TEXT DEFAULT 'REFEREE'`);
    } catch (e) {
        // Silently fail if columns exist or other DB issues
        console.warn("[DB-FIX] Self-healing attempt finished:", (e as any)?.message);
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
    const identifier = (formData.get("identifier") as string || "").trim();
    const password = (formData.get("password") as string || "").trim();

    if (!identifier || !password) {
        return { error: "Lütfen tüm alanları doldurun.", success: false };
    }

    // 0. Rate Limiting Check
    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";

    // Check existing attempt - wrap in try-catch so a transient DB error doesn't block login
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
        // DB bağlantısı geçici olarak kopmuşsa rate limiting'i atla, login devam etsin
        console.warn("[LOGIN] Rate limit DB check failed, skipping:", (rateLimitError as any)?.message);
    }

    // Ensure database columns exist before proceeding
    await ensureSchemaColumns();

    try {
        // 1. Find user by username OR tckn (with robust case-insensitive matching)
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: 'insensitive' } },
                    { tckn: identifier },
                ],
            },
            include: {
                role: true,
                referee: true
            },
        });

        if (!user) {
            await handleFailedLogin(ip, loginAttempt);
            // Unique error message for "Not Found" to distinguish from "Bad Password"
            return { error: "Bu kullanıcı adı veya TCKN ile kayıtlı bir hesap bulunamadı.", success: false };
        }

        // 1.5 Check if approved
        // Robust check for any Admin or Super Admin role
        const roleName = (user.role?.name || "").toUpperCase();
        const isAdminUser = roleName.includes("ADMIN");

        if (!user.isApproved && !isAdminUser) {
            return { error: "Başvurunuz Yönetici tarafından onay beklemektedir. Onaylandığı zaman bilgilendirileceksiniz.", success: false };
        }

        // 1.6 Check if suspended
        if (user.suspendedUntil && user.suspendedUntil > new Date()) {
            const formattedDate = user.suspendedUntil.toLocaleDateString('tr-TR');
            return { error: `Hesabınız ${formattedDate} tarihine kadar dondurulmuştur.`, success: false };
        }

        // 2. Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            await handleFailedLogin(ip, loginAttempt);
            return { error: "Girdiğiniz şifre hatalı. Lütfen kontrol ederek tekrar deneyiniz.", success: false };
        }

        // Success - Reset attempts
        if (loginAttempt) {
            await db.loginAttempt.delete({ where: { ipAddress: ip } });
        }

        // ADMIN BYPASS: Allow admins to login without 2FA
        if (user.role.name === "ADMIN" || user.role.name === "SUPER_ADMIN" || user.role.name === "ADMIN_IHK") {
            await createSession(user.id, user.role.name);
            const redirectPath = (user.role.name === "SUPER_ADMIN" || user.role.name === "ADMIN_IHK" || user.role.name === "ADMIN")
                ? "/admin"
                : "/";
            return { success: true, redirectTo: redirectPath, error: undefined };
        }

        // 2FA Logic
        // Generate Code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await db.user.update({
            where: { id: user.id },
            data: {
                verificationCode: code,
                verificationCodeExpiresAt: expiresAt
            }
        });

        // Send Email
        try {
            const { sendVerificationEmail } = await import("@/lib/email");

            // Determine Recipient Email
            let recipientEmail = user.referee?.email;

            // Fallback for Admin or missing email
            if (!recipientEmail) {
                if (user.role.name === "ADMIN") {
                    // For admin, if no profile email, try env or just warn
                    recipientEmail = process.env.SMTP_USER || "";
                    console.log("[AUTH] Admin email missing, using SMTP_USER as fallback.");
                } else {
                    // For regular users, if no email, we can't send.
                    // But we continue to avoid crashing. sendEmailSafe will handle empty string.
                    console.warn(`[AUTH] User ${user.id} has no email address.`);
                }
            }

            // We do NOT use user.username as it is TCKN
            await sendVerificationEmail(recipientEmail, code);

        } catch (emailError) {
            console.error("Failed to invoke email service:", emailError);
        }

        return { success: false, requireVerification: true, userId: user.id, error: undefined };

    } catch (error: any) {
        console.error("Login error:", error);
        console.error("Login Error Details:", error?.message);
        return { error: "Giriş yapılırken bir hata oluştu.", success: false };
    }
}

export async function verify2FA(userId: number, code: string): Promise<ActionState> {
    if (!userId || !code) return { error: "Geçersiz istek.", success: false };

    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { role: true, referee: true }
        });

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
        } else if (user.referee?.officialType === "REFEREE") {
            redirectTo = "/referee";
        } else {
            redirectTo = "/general";
        }

        return { success: true, redirectTo };
    } catch (e) {
        console.error(e);
        return { error: "Doğrulama hatası.", success: false };
    }
}

export async function register(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const tckn = formData.get("tckn") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const passwordConfirm = formData.get("passwordConfirm") as string;
    const roleType = formData.get("roleType") as string;
    const job = formData.get("job") as string;
    const address = formData.get("address") as string;
    const kvkk = formData.get("kvkk");

    const errors: ActionState['errors'] = {};

    if (!firstName) errors.firstName = "Ad gerekli.";
    if (!lastName) errors.lastName = "Soyad gerekli.";
    if (!tckn) errors.tckn = "TCKN gerekli.";
    if (!email) errors.email = "E-posta gerekli.";
    if (!phone) errors.phone = "Telefon gerekli.";
    if (!password) errors.password = "Şifre gerekli.";
    if (password !== passwordConfirm) errors.password = "Şifreler eşleşmiyor.";
    if (!roleType) errors.roleType = "Görev seçimi gerekli.";
    if (!kvkk) return { error: "KVKK ve Aydınlatma Metni'ni onaylamanız gerekmektedir.", success: false };

    if (Object.keys(errors).length > 0) {
        return { error: "Lütfen işaretli alanları kontrol edin.", errors, success: false };
    }

    if (tckn.length !== 11) {
        return { error: "TC Kimlik No 11 haneli olmalıdır.", errors: { tckn: "TCKN 11 haneli olmalıdır" }, success: false };
    }

    // Ensure database columns exist before proceeding
    await ensureSchemaColumns();

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Check existing user
        const existingTckn = await db.user.findFirst({ where: { tckn } });
        if (existingTckn) {
            return { error: "Bu TCKN ile kayıtlı bir kullanıcı zaten var.", errors: { tckn: "Bu TCKN zaten kullanımda." }, success: false };
        }

        const existingEmail = await db.referee.findUnique({ where: { email } });
        if (existingEmail) {
            return { error: "Bu E-posta ile kayıtlı bir kullanıcı zaten var.", errors: { email: "Bu E-posta zaten kullanımda." }, success: false };
        }

        // 3. Find or Create Role "REFEREE"
        let refereeRole = await db.role.findUnique({ where: { name: "REFEREE" } });
        if (!refereeRole) {
            refereeRole = await db.role.create({ data: { name: "REFEREE" } });
        }

        // 4. Username = TCKN (Requested by user)
        const generatedUsername = tckn;

        let createdUser;

        // 5. Transaction
        await db.$transaction(async (tx: any) => {
            createdUser = await tx.user.create({
                data: {
                    username: generatedUsername,
                    tckn: tckn,
                    password: hashedPassword,
                    roleId: refereeRole!.id,
                    isApproved: false // Explicitly set to false (referee registration)
                }
            });

            // Use Raw SQL to bypass stale Prisma Client validation for officialType and new fields
            // NOTE: job/address might be null, handle strings properly in SQL
            // ${job} if null might be issue? No, prisma sql template handles it?
            // Safer to use empty string if null, or verify prisma raw sql support for null.
            // Raw SQL with Prisma handles values.
            await tx.referee.create({
                data: {
                    userId: createdUser.id,
                    tckn: tckn,
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    phone: phone,
                    classification: 'BELIRLENMEMIS',
                    officialType: roleType,
                    job: job || null,
                    address: address || null
                }
            });
        });

        // 6. Direct Login (Skip verification for registration? Or require it?)
        // User said: "Require verification code ... log in yapamasın".
        // They should Login explicitly to get the code.
        // Return username so they know what to use.

        // 6. Return specific success message for approval
        return {
            success: true,
            username: generatedUsername,
            error: undefined,
            message: "Kayıt başarılı! Başvurunuz Yönetici tarafından onay beklemektedir. Onaylandığı zaman mail olarak bilgilendirileceksiniz."
        };

    } catch (error: any) {
        console.error("Register error:", error);
        console.error("Register Error Details:", error?.message);
        if (error?.code === 'P2002') {
            const target = (error.meta?.target as string[]) || [];
            if (target.includes('tckn')) {
                return { error: "Bu TCKN zaten kullanımda.", errors: { tckn: "Zaten kayıtlı." }, success: false };
            }
            if (target.includes('email')) {
                return { error: "Bu E-posta zaten kullanımda.", errors: { email: "Zaten kayıtlı." }, success: false };
            }
            if (target.includes('username')) {
                return { error: "Bu TCKN ile kayıtlı bir kullanıcı zaten var.", success: false };
            }
        }
    }
    return { error: "Kayıt olurken bir hata oluştu.", success: false };
}

export async function logout() {
    await deleteSession();
    redirect("/");
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
