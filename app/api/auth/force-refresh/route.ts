import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ refreshRequired: false }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { id: true, forceRefresh: true, role: true }
        });

        if (!user || (!user.forceRefresh && (user.role as any).name === session.role)) {
            return NextResponse.json({ refreshRequired: false });
        }

        // Re-sign session with the LATEST role from database
        const { createSession } = await import("@/lib/session");
        await createSession(user.id, (user.role as any).name);

        // Clear the flag if it was set
        if (user.forceRefresh) {
            await db.user.update({
                where: { id: user.id },
                data: { forceRefresh: false }
            });
        }

        console.log(`[FORCE_REFRESH] Updated session and triggering refresh for user ${user.id} (${(user.role as any).name})`);
        return NextResponse.json({ refreshRequired: true });
    } catch (error) {
        console.error("[FORCE_REFRESH_CHECK] Error:", error);
        return NextResponse.json({ refreshRequired: false }, { status: 500 });
    }
}
