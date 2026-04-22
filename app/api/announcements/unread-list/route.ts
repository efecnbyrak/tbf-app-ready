import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ announcements: [] });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { referee: true, official: true }
        });

        if (!user) {
            return NextResponse.json({ announcements: [] });
        }

        const targetGroups = ["ALL"];
        if (session.role === "REFEREE") targetGroups.push("REFEREE");
        if (session.role === "OBSERVER") targetGroups.push("OBSERVER");
        if (session.role === "TABLE") targetGroups.push("TABLE");
        if (user.official?.officialType === "STATISTICIAN") targetGroups.push("STATISTICIAN");
        if (user.official?.officialType === "HEALTH") targetGroups.push("HEALTH");

        // Fetch announcements the user hasn't read yet
        const unreadAnnouncements = await db.announcement.findMany({
            where: {
                target: { in: targetGroups },
                reads: {
                    none: { userId: session.userId }
                }
            },
            orderBy: { createdAt: "asc" }
        });

        return NextResponse.json({ announcements: unreadAnnouncements });
    } catch (e) {
        console.error("Error fetching unread list:", e);
        return NextResponse.json({ announcements: [] });
    }
}
