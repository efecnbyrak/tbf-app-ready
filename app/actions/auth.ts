"use server";

import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { Prisma, LoginAttempt } from "@prisma/client";
import { headers } from "next/headers";

export interface ActionState {
    error?: string;
    success: boolean;
    username?: string;
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
    const identifier = formData.get("identifier") as string;
    const password = formData.get("password") as string;

    if (!identifier || !password) {
        return { error: "Lütfen tüm alanları doldurun.", success: false };
    }

    // 0. Rate Limiting Check
    const ip = (await headers()).get("x-forwarded-for") || "127.0.0.1";

    // Check existing attempt
    let loginAttempt = await db.loginAttempt.findUnique({
        where: { ipAddress: ip }
    });

    if (loginAttempt) {
        if (loginAttempt.blockedUntil && loginAttempt.blockedUntil > new Date()) {
            const minutesLeft = Math.ceil((loginAttempt.blockedUntil.getTime() - new Date().getTime()) / 60000);
            return { error: `Çok fazla başarısız deneme. Lütfen ${minutesLeft} dakika bekleyin.`, success: false };
        }
    }

    try {
        // 1. Find user by username OR tckn
        const user = await db.user.findFirst({
            where: {
                OR: [{ username: identifier }, { tckn: identifier }],
            },
            include: {
                role: true,
                referee: true
            },
        });

        if (!user) {
            await handleFailedLogin(ip, loginAttempt);
            return { error: "Kullanıcı bulunamadı veya şifre hatalı.", success: false };
        }

        // 2. Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Debug logging
        console.log('[LOGIN DEBUG] bcrypt.compare result:', isPasswordValid);
        console.log('[LOGIN DEBUG] user.role.name:', user.role.name);

        if (!isPasswordValid) {
            await handleFailedLogin(ip, loginAttempt);
            return { error: "Kullanıcı bulunamadı veya şifre hatalı.", success: false };
        }

        // Success - Reset attempts
        if (loginAttempt) {
            await db.loginAttempt.delete({ where: { ipAddress: ip } });
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

        // Send Email (Mock)
        // In production, use nodemailer or similar
        console.log(`[EMAIL SEND] To: ${user.referee?.email || 'System'}, Code: ${code}`);

        return { success: false, requireVerification: true, userId: user.id, error: undefined };

    } catch (error) {
        console.error("Login error:", error);
        const errMsg = (error as any)?.message || "Bilinmeyen hata";
        console.error("Login Error Details:", errMsg);
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
        if (user.role.name === "ADMIN") {
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
    if (!roleType) errors.roleType = "Görev seçimi gerekli.";
    if (!kvkk) return { error: "KVKK ve Aydınlatma Metni'ni onaylamanız gerekmektedir.", success: false };

    if (Object.keys(errors).length > 0) {
        return { error: "Lütfen işaretli alanları kontrol edin.", errors, success: false };
    }

    if (tckn.length !== 11) {
        return { error: "TC Kimlik No 11 haneli olmalıdır.", errors: { tckn: "TCKN 11 haneli olmalıdır" }, success: false };
    }

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
        await db.$transaction(async (tx) => {
            createdUser = await tx.user.create({
                data: {
                    username: generatedUsername,
                    tckn: tckn,
                    password: hashedPassword,
                    roleId: refereeRole!.id,
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

        return { success: true, username: generatedUsername, error: undefined };

    } catch (error) {
        console.error("Register error:", error);
        console.error("Register Error Details:", (error as any)?.message);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
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
}

export async function logout() {
    await deleteSession();
    redirect("/");
}

async function handleFailedLogin(ip: string, loginAttempt: LoginAttempt | null) {
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
