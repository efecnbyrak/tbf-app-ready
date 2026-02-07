import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";

// GET /api/videos
export async function GET() {
    try {
        const videos = await db.video.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(videos);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/videos
export async function POST(req: Request) {
    try {
        // Auth check (basic)
        // In real app, check session/role here

        const body = await req.json();
        const { title, url, category, description, duration } = body;

        const video = await db.video.create({
            data: {
                title,
                url,
                category,
                description,
                duration
            }
        });

        return NextResponse.json(video);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
