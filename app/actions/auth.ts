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
    errors?: {
        firstName?: string;
        lastName?: string;
        tckn?: string;
        email?: string;
        phone?: string;
        password?: string;
        roleType?: string;
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

        // 3. Create Session
        await createSession(user.id, user.role.name);

        // 4. Determine redirect path
        let redirectTo = "/";
        if (user.role.name === "ADMIN") {
            redirectTo = "/admin";
        } else if (user.referee?.officialType === "REFEREE") {
            redirectTo = "/referee";
        } else {
            redirectTo = "/general";
        }

        console.log('[LOGIN DEBUG] Success! Redirecting to:', redirectTo);

        return { success: true, redirectTo };
    } catch (error) {
        console.error("Login error:", error);
        const errMsg = (error as any)?.message || "Bilinmeyen hata";
        console.error("Login Error Details:", errMsg);
        return { error: "Giriş yapılırken bir hata oluştu.", success: false };
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

    const errors: ActionState['errors'] = {};

    if (!firstName) errors.firstName = "Ad gerekli.";
    if (!lastName) errors.lastName = "Soyad gerekli.";
    if (!tckn) errors.tckn = "TCKN gerekli.";
    if (!email) errors.email = "E-posta gerekli.";
    if (!phone) errors.phone = "Telefon gerekli.";
    if (!password) errors.password = "Şifre gerekli.";
    if (!roleType) errors.roleType = "Görev seçimi gerekli.";

    if (Object.keys(errors).length > 0) {
        return { error: "Lütfen işaretli alanları kontrol edin.", errors, success: false };
    }

    if (tckn.length !== 11) {
        return { error: "TC Kimlik No 11 haneli olmalıdır.", errors: { tckn: "TCKN 11 haneli olmalıdır" }, success: false };
    }

    try {
        // 1. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Check existing user MANUALLY first to give better error messages
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

        // 4. Generate Username (e.g. efe.can.bayrak.5462)
        const cleanName = (str: string) => str.toLowerCase()
            .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
            .replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');

        const slugFirst = cleanName(firstName);
        const slugLast = cleanName(lastName);
        const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random

        const generatedUsername = `${slugFirst}.${slugLast}${randomSuffix}`;

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

            // Use Raw SQL to bypass stale Prisma Client validation for officialType
            await tx.$executeRaw`
                INSERT INTO referees ("userId", tckn, "firstName", "lastName", email, phone, classification, "officialType", "createdAt", "updatedAt")
                VALUES (${createdUser.id}, ${tckn}, ${firstName}, ${lastName}, ${email}, ${phone}, 'BELIRLENMEMIS', ${roleType}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `;
        });

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
                    // Retry logic could be here, but highly unlikely
                    return { error: "Sistem hatası (Kullanıcı adı çakışması). Lütfen tekrar deneyin.", success: false };
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
