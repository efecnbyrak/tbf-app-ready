import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { sendAvailabilityConfirmationEmail } from "@/lib/email";

const getMobileKey = () => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("CRITICAL: NEXTAUTH_SECRET or JWT_SECRET must be set in production.");
        }
        return new TextEncoder().encode("dev-only-mobile-key-not-for-production!!");
    }
    return new TextEncoder().encode(secret);
};

async function verifyMobileToken(request: NextRequest): Promise<{ userId: number; role: string; dbError?: boolean } | null> {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        console.warn("[verifyMobileToken] No Bearer token in Authorization header");
        return null;
    }

    const token = authHeader.slice(7);
    if (!token) return null;

    let dbFailed = false;

    // Primary: DB-backed hash verification (bypasses JWT key issues entirely)
    try {
        const tokenHash = createHash("sha256").update(token).digest("hex");
        const userWithToken = await db.user.findFirst({
            where: {
                mobileToken: tokenHash,
                mobileTokenExpiry: { gt: new Date() },
            },
            include: { role: true },
        });
        if (userWithToken) {
            console.log(`[verifyMobileToken] DB hash match OK — userId=${userWithToken.id}`);
            return { userId: userWithToken.id, role: userWithToken.role.name };
        }
        console.warn("[verifyMobileToken] DB hash: no match or token expired, falling back to JWT");
    } catch (err) {
        console.error("[verifyMobileToken] DB verification error:", err);
        dbFailed = true;
    }

    // Fallback: JWT signature verification (when DB is down or token not found in DB)
    try {
        const { payload } = await jwtVerify(token, getMobileKey(), { algorithms: ["HS256"] });
        if (!payload.userId) {
            console.warn("[verifyMobileToken] JWT payload missing userId");
            return null;
        }
        console.log(`[verifyMobileToken] JWT fallback OK — userId=${payload.userId} dbFailed=${dbFailed}`);
        return { userId: payload.userId as number, role: payload.role as string, dbError: dbFailed };
    } catch (err: any) {
        console.error("[verifyMobileToken] JWT verification error:", err?.code ?? err?.message ?? err);
        return null;
    }
}

/**
 * GET /api/mobile/availability
 * Returns current availability window + existing form for the authenticated user.
 */
export async function GET(request: NextRequest) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    if (auth.dbError) {
        return NextResponse.json({ error: "Veritabanı geçici olarak kullanılamıyor. Lütfen tekrar deneyin." }, { status: 503 });
    }

    try {
        const [refereeProfile, officialProfile] = await Promise.all([
            db.referee.findUnique({
                where: { userId: auth.userId },
                include: { regions: true, user: true },
            }),
            db.generalOfficial.findUnique({
                where: { userId: auth.userId },
                include: { regions: true, user: true },
            }),
        ]);

        const profile: any = refereeProfile || officialProfile;
        const isOfficial = !refereeProfile;

        if (!profile) {
            return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });
        }

        const { startDate, endDate, deadline, openTime, isLocked, mode, weekNumber } =
            await getAvailabilityWindow();

        const existingForm = await db.availabilityForm.findFirst({
            where: {
                ...(isOfficial ? { officialId: profile.id } : { refereeId: profile.id }),
                weekStartDate: startDate,
            },
            include: { days: true },
        });

        // Build 7 days array
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const existingDay = existingForm?.days.find(
                (day: any) => new Date(day.date).toDateString() === d.toDateString()
            );
            days.push({
                index: i,
                date: d.toISOString(),
                slots: existingDay?.slots ?? "Uygun Değil",
            });
        }

        // Check suspension
        const activePenalty = await db.penalty.findFirst({
            where: {
                userId: auth.userId,
                isActive: true,
                OR: [{ endDate: null }, { endDate: { gt: new Date() } }],
            },
        });

        const isSuspended =
            !!(profile.user.suspendedUntil && profile.user.suspendedUntil > new Date()) ||
            !!activePenalty;

        return NextResponse.json({
            window: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                deadline: deadline.toISOString(),
                openTime: openTime.toISOString(),
                isLocked: isLocked || isSuspended,
                mode,
                weekNumber,
            },
            profile: {
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone || "",
                regions: profile.regions.map((r: any) => r.name),
                classification: profile.classification || null,
                isOfficial,
            },
            existingForm: existingForm
                ? {
                      id: existingForm.id,
                      status: existingForm.status,
                      submittedAt: existingForm.createdAt,
                      days,
                  }
                : null,
            isSuspended,
            suspendedUntil: profile.user.suspendedUntil?.toISOString() ?? null,
        });
    } catch (error) {
        console.error("[API/MOBILE/AVAILABILITY] GET error:", error);
        return NextResponse.json({ error: "Sistem hatası." }, { status: 500 });
    }
}

const VALID_SLOTS = ["Sabah", "Öğleden Sonra", "Akşam", "Tüm Gün", "Uygun Değil"];
const VALID_REGIONS = ["Avrupa", "Anadolu", "BGM"];

/**
 * POST /api/mobile/availability
 * Submits the availability form for the authenticated user.
 *
 * Body: {
 *   phone: string,
 *   regions: string[],
 *   days: { index: number; slots: string }[]  // index 0-6, slots from VALID_SLOTS
 * }
 */
export async function POST(request: NextRequest) {
    const auth = await verifyMobileToken(request);
    if (!auth) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    if (auth.dbError) {
        return NextResponse.json({ error: "Veritabanı geçici olarak kullanılamıyor. Lütfen tekrar deneyin." }, { status: 503 });
    }

    try {
        const body = await request.json();
        const { phone, regions, days } = body;

        if (!Array.isArray(days) || days.length !== 7) {
            return NextResponse.json({ error: "Geçersiz gün verisi." }, { status: 400 });
        }

        for (const d of days) {
            if (!VALID_SLOTS.includes(d.slots)) {
                return NextResponse.json({ error: `Geçersiz slot: ${d.slots}` }, { status: 400 });
            }
        }

        const [refereeProfile, officialProfile] = await Promise.all([
            db.referee.findUnique({ where: { userId: auth.userId }, include: { regions: true, user: true } }),
            db.generalOfficial.findUnique({ where: { userId: auth.userId }, include: { regions: true, user: true } }),
        ]);

        const profile: any = refereeProfile || officialProfile;
        const isOfficial = !refereeProfile;

        if (!profile) return NextResponse.json({ error: "Profil bulunamadı." }, { status: 404 });

        if (profile.user.suspendedUntil && profile.user.suspendedUntil > new Date()) {
            const dateStr = profile.user.suspendedUntil.toLocaleDateString("tr-TR");
            return NextResponse.json(
                { error: `Hesabınız ${dateStr} tarihine kadar dondurulmuştur.` },
                { status: 403 }
            );
        }

        const { startDate, isLocked } = await getAvailabilityWindow();
        if (isLocked) {
            return NextResponse.json({ error: "Form gönderim süresi doldu." }, { status: 403 });
        }

        // Upsert regions
        const verifiedRegionIds: number[] = [];
        const filteredRegions = (regions as string[]).filter((r) => VALID_REGIONS.includes(r));
        for (const name of filteredRegions) {
            const region = await db.region.upsert({
                where: { name },
                create: { name },
                update: {},
            });
            verifiedRegionIds.push(region.id);
        }

        // Update profile
        if (isOfficial) {
            await db.generalOfficial.update({
                where: { id: profile.id },
                data: { phone, regions: { set: verifiedRegionIds.map((id) => ({ id })) } },
            });
        } else {
            await db.referee.update({
                where: { id: profile.id },
                data: { phone, regions: { set: verifiedRegionIds.map((id) => ({ id })) } },
            });
        }

        // Upsert form
        let form = await db.availabilityForm.findFirst({
            where: {
                ...(isOfficial ? { officialId: profile.id } : { refereeId: profile.id }),
                weekStartDate: startDate,
            },
        });

        if (form) {
            form = await db.availabilityForm.update({
                where: { id: form.id },
                data: { status: "SUBMITTED" },
            });
        } else {
            form = await db.availabilityForm.create({
                data: {
                    ...(isOfficial ? { officialId: profile.id } : { refereeId: profile.id }),
                    weekStartDate: startDate,
                    status: "SUBMITTED",
                },
            });
        }

        const createOps: any[] = [];
        const savedDays: { dayName: string; date: string; slots: string }[] = [];

        for (let i = 0; i < 7; i++) {
            const dayEntry = days.find((d: any) => d.index === i);
            const slot = dayEntry?.slots ?? "Uygun Değil";

            if (slot !== "Uygun Değil") {
                const dayDate = new Date(startDate);
                dayDate.setDate(startDate.getDate() + i);
                createOps.push(
                    db.availabilityDay.create({
                        data: { formId: form.id, date: dayDate, slots: slot },
                    })
                );
                savedDays.push({
                    dayName: dayDate.toLocaleDateString("tr-TR", { weekday: "long" }),
                    date: dayDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" }),
                    slots: slot,
                });
            }
        }

        await db.$transaction([
            db.availabilityDay.deleteMany({ where: { formId: form.id } }),
            ...createOps,
        ]);

        // Send confirmation email (non-blocking)
        try {
            const weekNum = await db.systemSetting.findUnique({ where: { key: "CURRENT_WEEK_NUMBER" } });
            const weekNumberLabel = weekNum?.value ? `${weekNum.value}. Hafta` : "İlgili Hafta";

            const weekStartStr = startDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
            const weekEndDate = new Date(startDate);
            weekEndDate.setDate(startDate.getDate() + 6);
            const weekEndStr = weekEndDate.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
            const weekLabel = `${weekNumberLabel} (${weekStartStr} – ${weekEndStr})`;

            const deadline = new Date(startDate);
            deadline.setDate(startDate.getDate() - 4);
            deadline.setHours(20, 30, 0, 0);
            const deadlineStr = deadline.toLocaleDateString("tr-TR", {
                day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            });

            const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
            const formUrl = isOfficial ? `${appUrl}/general/availability` : `${appUrl}/referee/availability`;

            await sendAvailabilityConfirmationEmail(
                profile.email,
                `${profile.firstName} ${profile.lastName}`,
                weekLabel,
                savedDays,
                deadlineStr,
                formUrl
            );
        } catch (emailError) {
            console.error("[API/MOBILE/AVAILABILITY] Email send failed:", emailError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API/MOBILE/AVAILABILITY] POST error:", error);
        return NextResponse.json({ error: "Kaydedilemedi." }, { status: 500 });
    }
}
