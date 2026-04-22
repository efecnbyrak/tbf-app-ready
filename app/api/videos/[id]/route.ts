import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/videos/[id]
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const body = await req.json();
        const { title, url, category, description, duration, videoCategoryId } = body;

        const video = await db.video.update({
            where: { id },
            data: {
                title,
                url,
                category,
                description,
                duration,
                videoCategoryId: videoCategoryId ? parseInt(videoCategoryId) : null
            },
            include: {
                videoCategory: true
            }
        });

        return NextResponse.json(video);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/videos/[id]
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        console.log(`Deleting video with ID: ${id}`);
        await db.video.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting video:", error);
        return NextResponse.json({ error: "Internal Server Error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
    }
}

// PATCH /api/videos/[id] - Increment viewCount
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);

        const updatedVideo = await db.video.update({
            where: { id },
            data: {
                viewCount: {
                    increment: 1
                }
            }
        });

        return NextResponse.json(updatedVideo);
    } catch (error) {
        console.error("Error incrementing view count:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
