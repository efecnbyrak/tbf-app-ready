import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// GET /api/rules
export async function GET() {
    try {
        const rules = await db.ruleBook.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(rules);
    } catch (error) {
        console.error("[API /api/rules GET] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/rules
export async function POST(req: Request) {
    console.log("[API /api/rules POST] Request received");
    try {
        const formData = await req.formData();
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as string; // "PDF" or "JSON"

        if (!title) {
            return NextResponse.json({ error: "Başlık zorunludur" }, { status: 400 });
        }

        let fileUrl: string | null = null;
        let finalContent: string | null = null;

        if (type === "JSON") {
            finalContent = formData.get("jsonContent") as string;
            console.log("[API] JSON content received, length:", finalContent?.length ?? 0);
        } else {
            // Handle PDF
            const file = formData.get("file") as File;
            if (!file || file.size === 0) {
                return NextResponse.json({ error: "PDF dosyası gereklidir" }, { status: 400 });
            }

            console.log("[API] PDF file received:", file.name, "size:", file.size);
            const buffer = Buffer.from(await file.arrayBuffer());

            const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
            const isVercel = !!process.env.VERCEL;

            if (blobToken) {
                // ✅ Best path: Vercel Blob (permanent public URL)
                const { put } = await import('@vercel/blob');
                const filename = `rules/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const blob = await put(filename, buffer, {
                    access: 'public',
                    contentType: 'application/pdf',
                });
                fileUrl = blob.url;
                console.log("[API] File saved to Vercel Blob:", fileUrl);
            } else if (!isVercel) {
                // ✅ Local dev: save to public folder (writable on local machine)
                const fs = await import('fs/promises');
                const path = await import('path');
                const sanitizedFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rules');
                await fs.mkdir(uploadDir, { recursive: true });
                const filePath = path.join(uploadDir, sanitizedFilename);
                await fs.writeFile(filePath, buffer);
                fileUrl = `/uploads/rules/${sanitizedFilename}`;
                console.log("[API] File saved locally:", fileUrl);
            } else {
                // ✅ Vercel without Blob: store PDF as base64 data URL in the DB
                // This is the fallback so uploads don't fail when blob is not configured
                const base64 = buffer.toString('base64');
                fileUrl = `data:application/pdf;base64,${base64}`;
                console.log("[API] No BLOB_READ_WRITE_TOKEN set. Stored PDF as base64 in DB.");
            }
        }

        // Create rule
        const rule = await (db.ruleBook.create as any)({
            data: {
                title,
                url: fileUrl,
                content: finalContent,
                category: category || null,
                description: description || null,
            },
        });

        console.log("[API] Rule created successfully, id:", rule.id);
        return NextResponse.json(rule);
    } catch (error: any) {
        console.error("[API] Error saving rule:", error);
        return NextResponse.json({
            error: "İşlem başarısız.",
            details: error.message
        }, { status: 500 });
    }
}
