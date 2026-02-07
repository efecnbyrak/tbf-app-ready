import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// PUT /api/rules/[id]
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        const body = await req.json();
        const { title, url, category, description } = body;

        const rule = await db.ruleBook.update({
            where: { id },
            data: {
                title,
                url,
                category,
                description
            }
        });

        return NextResponse.json(rule);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/rules/[id]
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        await db.ruleBook.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
