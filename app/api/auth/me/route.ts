import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { jwtVerify } from "jose";

/**
 * GET /api/auth/me
 * 
 * Mobile-only REST endpoint to retrieve the current user's profile.
 * Requires Authorization: Bearer <token> header.
 * 
 * Does NOT interfere with the existing web session/cookie flow.
 */

const getMobileKey = () => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            console.warn("[API/ME] Secret missing during build phase.");
            return new TextEncoder().encode("temp-build-key");
        }
        throw new Error("CRITICAL: NEXTAUTH_SECRET or JWT_SECRET environment variable is missing.");
    }
    return new TextEncoder().encode(secret);
};


export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Token gereklidir." }, { status: 401 });
        }

        const token = authHeader.substring(7);

        let payload: any;
        try {
            const result = await jwtVerify(token, getMobileKey(), { algorithms: ["HS256"] });
            payload = result.payload;
        } catch (e) {
            return NextResponse.json({ error: "Geçersiz veya süresi dolmuş token." }, { status: 401 });
        }

        if (!payload?.userId) {
            return NextResponse.json({ error: "Geçersiz token." }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: payload.userId },
            include: {
                role: true,
                referee: true,
                official: true,
            },
        }) as any;

        if (!user) {
            return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
        }

        const profile = user.referee || user.official;

        return NextResponse.json({
            user: {
                id: user.id,
                username: user.username,
                tckn: user.tckn,
                role: user.role.name,
                firstName: profile?.firstName || null,
                lastName: profile?.lastName || null,
                email: profile?.email || null,
                phone: profile?.phone || null,
                classification: profile?.classification || null,
                isApproved: user.isApproved,
                isActive: user.isActive,
            },
        });

    } catch (error: any) {
        console.error("[API/ME] Error:", error);
        return NextResponse.json(
            { error: "Profil bilgileri alınırken bir hata oluştu." },
            { status: 500 }
        );
    }
}
