import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/videos/[id]/view - Increment view count
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const videoId = parseInt(id);

        const video = await db.video.update({
            where: { id: videoId },
            data: {
                viewCount: {
                    increment: 1
                }
            },
            select: {
                id: true,
                viewCount: true
            }
        });

        return NextResponse.json(video);
    } catch (error) {
        console.error("Error incrementing view count:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
