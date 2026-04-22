import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ hasUnread: false, count: 0 });
        }

        // Fetch user's roles/types to determine which announcements they should see
        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { referee: true, official: true }
        });

        if (!user) {
            return NextResponse.json({ hasUnread: false, count: 0 });
        }

        const targetGroups = ["ALL"];
        if (session.role === "REFEREE") targetGroups.push("REFEREE");
        if (session.role === "OBSERVER") targetGroups.push("OBSERVER");
        if (session.role === "TABLE") targetGroups.push("TABLE");
        if (user.official?.officialType === "STATISTICIAN") targetGroups.push("STATISTICIAN");
        if (user.official?.officialType === "HEALTH") targetGroups.push("HEALTH");

        // Count announcements that are targeted to the user but not read
        const unreadCount = await db.announcement.count({
            where: {
                target: { in: targetGroups },
                reads: {
                    none: { userId: session.userId }
                }
            }
        });

        return NextResponse.json({
            hasUnread: unreadCount > 0,
            count: unreadCount
        });
    } catch (e) {
        console.error("Error fetching unread announcements:", e);
        return NextResponse.json({ hasUnread: false, count: 0 });
    }
}
