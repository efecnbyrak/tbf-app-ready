import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/videos
export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const videos = await db.video.findMany({
            include: {
                videoCategory: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(videos, {
            headers: {
                'Cache-Control': 'private, s-maxage=3600, stale-while-revalidate=59'
            }
        });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/videos (Admin only)
export async function POST(req: Request) {
    try {
        const session = await getSession();
        const adminRoles = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];
        if (!session?.userId || !adminRoles.includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, url, category, description, duration, videoCategoryId } = body;

        const video = await db.video.create({
            data: {
                title,
                url,
                category, // Keep for legacy support
                description,
                duration: typeof duration === 'string' ? parseInt(duration) : (duration || 0),
                videoCategoryId: videoCategoryId ? parseInt(videoCategoryId) : null
            },
            include: {
                videoCategory: true
            }
        });

        return NextResponse.json(video);
    } catch (error) {
        console.error("Error creating video:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
