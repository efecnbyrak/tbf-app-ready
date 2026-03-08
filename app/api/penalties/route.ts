import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";

export async function GET() {
    try {
        const session = await verifySession();

        const penalties = await db.penalty.findMany({
            where: {
                userId: session.userId
            },
            orderBy: {
                startDate: 'desc'
            }
        });

        return NextResponse.json(penalties);
    } catch (error) {
        console.error("Error fetching penalties:", error);
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
}
