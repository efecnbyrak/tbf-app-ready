import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const regions = await db.region.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(regions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 });
    }
}
