import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/rules
export async function GET() {
    try {
        const rules = await db.ruleBook.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(rules);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/rules
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { title, url, category, description } = body;

        const rule = await db.ruleBook.create({
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
