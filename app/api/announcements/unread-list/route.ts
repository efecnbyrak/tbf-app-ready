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

        // Role is already in the verified session JWT — no extra DB fetch needed
        const targetGroups = ["ALL"];
        const roleTargets = ["REFEREE", "OBSERVER", "TABLE", "STATISTICIAN", "HEALTH", "FIELD_COMMISSIONER"];
        if (roleTargets.includes(session.role)) targetGroups.push(session.role);

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
