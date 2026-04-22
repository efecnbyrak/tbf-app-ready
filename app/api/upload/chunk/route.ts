import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await verifySession();
        const adminRoles = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];
        if (!adminRoles.includes(session.role)) {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }

        const { uploadId, index, data } = await req.json();

        await (db.uploadChunk as any).create({
            data: {
                pendingUploadId: uploadId,
                index,
                data
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
