import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const session = await verifySession();
        const adminRoles = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];
        if (!adminRoles.includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { title, type, groups, categories, count, dueDate } = body;

        const assignment = await db.examAssignment.create({
            data: {
                title,
                assignmentType: type,
                targetGroups: groups,
                targetCategories: categories,
                questionCount: parseInt(count) || 20,
                dueDate: dueDate ? new Date(dueDate) : null,
                createdById: session.userId,
            },
            include: {
                createdBy: {
                    select: { username: true }
                },
                _count: {
                    select: { attempts: true }
                }
            }
        });

        return NextResponse.json(assignment);
    } catch (error) {
        console.error("Assignment Creation Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const session = await verifySession();
        const adminRoles = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];
        if (!adminRoles.includes(session.role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        await db.examAssignment.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Assignment Deletion Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
