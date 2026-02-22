import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";

export async function POST(req: Request) {
    try {
        const session = await verifySession();
        if (session.role !== "ADMIN") {
            return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });
        }

        const { uploadId, title, category, description } = await req.json();

        // 1. Get all chunks in order
        const chunks = await (db.uploadChunk as any).findMany({
            where: { pendingUploadId: uploadId },
            orderBy: { index: 'asc' }
        });

        if (chunks.length === 0) {
            return NextResponse.json({ error: "Dosya parçaları bulunamadı" }, { status: 400 });
        }

        // 2. Combine chunks (Base64 data)
        const fullBase64 = chunks.map((c: any) => c.data).join('');
        const fileUrl = `data:application/pdf;base64,${fullBase64}`;

        // 3. Create RuleBook entry
        const rule = await (db.ruleBook.create as any)({
            data: {
                title,
                category: category || null,
                description: description || null,
                url: fileUrl,
                content: null,
            },
        });

        // 4. Cleanup temporary chunks and pending upload
        await (db.pendingUpload as any).delete({ where: { id: uploadId } });

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error("[COMPLETION ERROR]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
