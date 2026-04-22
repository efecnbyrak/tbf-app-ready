import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const regions = await db.region.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(regions);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch regions" }, { status: 500 });
    }
}
