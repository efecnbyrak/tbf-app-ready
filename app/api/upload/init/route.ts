import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await verifySession();
        if (session.role !== "ADMIN") {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }

        const { filename, type, total } = await req.json();

        const pending = await (db.pendingUpload as any).create({
            data: {
                filename,
                type,
                total: total || 0
            }
        });

        return NextResponse.json({ uploadId: pending.id });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
