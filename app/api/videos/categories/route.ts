import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// GET /api/videos/categories - List all categories
export async function GET() {
    try {
        const categories = await db.videoCategory.findMany({
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: {
                    select: { videos: true }
                }
            }
        });
        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching video categories:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/videos/categories - Create new category (Admin only)
export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if admin
        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { role: true }
        });

        if (user?.role.name !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { name, description, displayOrder } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const category = await db.videoCategory.create({
            data: {
                name,
                description,
                displayOrder: displayOrder || 0
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error creating video category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
