import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { ensureSchemaColumns } from "@/app/actions/auth";

/**
 * POST /api/auth/login
 * 
 * Mobile-only REST endpoint for authentication.
 * Returns a JWT token for use in Authorization header.
 * 
 * Body: { identifier: string, password: string }
 * 
 * Does NOT interfere with the existing web session/cookie flow.
 */

const getMobileKey = () => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            console.warn("[API/LOGIN] Secret missing during build phase.");
            return new TextEncoder().encode("temp-build-key");
        }
        throw new Error("CRITICAL: NEXTAUTH_SECRET or JWT_SECRET environment variable is missing.");
    }
    return new TextEncoder().encode(secret);
};

async function createMobileToken(userId: number, role: string) {
    return await new SignJWT({ userId, role, mobile: true })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("30d")
        .sign(getMobileKey());
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { identifier, password } = body;

        if (!identifier || !password) {
            return NextResponse.json(
                { error: "TCKN/Kullanıcı adı ve şifre gereklidir." },
                { status: 400 }
            );
        }

        await ensureSchemaColumns();

        // Rate limiting check by IP
        const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

        let loginAttempt = null;
        try {
            loginAttempt = await db.loginAttempt.findUnique({
                where: { ipAddress: ip }
            });

            if (loginAttempt?.blockedUntil && loginAttempt.blockedUntil > new Date()) {
                const minutesLeft = Math.ceil((loginAttempt.blockedUntil.getTime() - new Date().getTime()) / 60000);
                return NextResponse.json(
                    { error: `Çok fazla başarısız deneme. Lütfen ${minutesLeft} dakika bekleyin.` },
                    { status: 429 }
                );
            }
        } catch (e) {
            console.warn("[API/LOGIN] Rate limit check warning:", (e as any)?.message);
        }

        // Find user
        const user = await db.user.findFirst({
            where: {
                OR: [
                    { username: { equals: identifier, mode: "insensitive" } },
                    { tckn: identifier },
                ],
            },
            include: {
                role: true,
                referee: true,
                official: true,
            },
        }) as any;

        const genericError = "Giriş bilgileri hatalı. Lütfen kontrol ederek tekrar deneyiniz.";

        if (!user) {
            await handleFailedLoginAPI(ip, loginAttempt);
            return NextResponse.json({ error: genericError }, { status: 401 });
        }

        // Access checks
        const roleName = (user.role?.name || "").toUpperCase();
        const isAdminUser = roleName.includes("ADMIN");

        if (!user.isApproved && !isAdminUser) {
            return NextResponse.json(
                { error: "Hesabınız henüz onaylanmamıştır. Lütfen yöneticinin onaylamasını bekleyin." },
                { status: 403 }
            );
        }

        if (!user.isActive && !isAdminUser) {
            return NextResponse.json(
                { error: "Hesabınız pasif konumdadır. Lütfen yönetici ile iletişime geçin." },
                { status: 403 }
            );
        }

        if (user.suspendedUntil && user.suspendedUntil > new Date()) {
            const dateStr = user.suspendedUntil.toLocaleDateString("tr-TR");
            return NextResponse.json(
                { error: `Hesabınız ${dateStr} tarihine kadar askıya alınmıştır.` },
                { status: 403 }
            );
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            await handleFailedLoginAPI(ip, loginAttempt);
            return NextResponse.json({ error: genericError }, { status: 401 });
        }

        // Success — clear rate limit
        if (loginAttempt) {
            try {
                await db.loginAttempt.delete({ where: { ipAddress: ip } });
            } catch (_) { }
        }

        // Update last login
        await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Create JWT token for mobile
        const token = await createMobileToken(user.id, user.role.name);

        // Build user response
        const profile = user.referee || user.official;
        const userResponse = {
            id: user.id,
            username: user.username,
            tckn: user.tckn,
            role: user.role.name,
            firstName: profile?.firstName || null,
            lastName: profile?.lastName || null,
            email: profile?.email || null,
            phone: profile?.phone || null,
            classification: profile?.classification || null,
        };

        return NextResponse.json({
            success: true,
            token,
            user: userResponse,
        });

    } catch (error: any) {
        console.error("[API/LOGIN] Error:", error);
        return NextResponse.json(
            { error: "Sistemde bir hata oluştu. Lütfen daha sonra tekrar deneyiniz." },
            { status: 500 }
        );
    }
}

// Helper: rate limiting for failed login attempts
async function handleFailedLoginAPI(ip: string, loginAttempt: any) {
    const now = new Date();
    try {
        if (!loginAttempt) {
            await db.loginAttempt.create({
                data: { ipAddress: ip, attempts: 1, lastAttempt: now },
            });
        } else {
            const newAttempts = loginAttempt.attempts + 1;
            let blockedUntil = null;
            if (newAttempts >= 5) {
                blockedUntil = new Date(now.getTime() + 5 * 60 * 1000);
            }
            await db.loginAttempt.update({
                where: { ipAddress: ip },
                data: { attempts: newAttempts, lastAttempt: now, blockedUntil },
            });
        }
    } catch (e) {
        console.warn("[API/LOGIN] Rate limit write warning:", (e as any)?.message);
    }
}
