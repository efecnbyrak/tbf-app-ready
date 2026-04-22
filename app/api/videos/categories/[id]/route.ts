import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// PUT /api/videos/categories/[id] - Update category
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { role: true }
        });

        if (user?.role.name !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const { name, description, displayOrder } = body;

        const category = await db.videoCategory.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                displayOrder
            }
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating video category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/videos/categories/[id] - Delete category
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: { role: true }
        });

        if (user?.role.name !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        // Delete category (videos will have their categoryId set to null due to onDelete: SetNull)
        await db.videoCategory.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting video category:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
