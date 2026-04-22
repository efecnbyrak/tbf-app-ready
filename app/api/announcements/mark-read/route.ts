import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const announcementIdRaw = formData.get("announcementId");
        if (!announcementIdRaw) {
            return NextResponse.json({ success: false, error: "Missing announcementId" }, { status: 400 });
        }

        const announcementId = parseInt(announcementIdRaw.toString(), 10);

        // Record the read action
        await db.announcementRead.create({
            data: {
                userId: session.userId,
                announcementId: announcementId
            }
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        // Ignore unique constraint errors if double submitted
        if (e.code === 'P2002') {
            return NextResponse.json({ success: true });
        }
        console.error("Error marking as read:", e);
        return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
    }
}
