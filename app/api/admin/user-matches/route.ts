import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get("userId") || "");
    if (!userId) return NextResponse.json({ error: "userId gerekli" }, { status: 400 });

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { matchStore: true }
    });

    if (!user) return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });

    return NextResponse.json({ matchStore: user.matchStore });
}
