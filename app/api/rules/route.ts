import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

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
        let finalContent: string = "";

        if (type === "JSON") {
            finalContent = formData.get("jsonContent") as string;
            console.log("[API] JSON content received, length:", finalContent?.length ?? 0);
        } else {
            // Handle PDF — no text extraction, just save the file
            const file = formData.get("file") as File;
            if (!file || file.size === 0) {
                return NextResponse.json({ error: "PDF dosyası gereklidir" }, { status: 400 });
            }

            console.log("[API] PDF file received:", file.name, "size:", file.size);
            const buffer = Buffer.from(await file.arrayBuffer());

            // Save file
            const hasBlob = process.env.BLOB_READ_WRITE_TOKEN;
            if (hasBlob) {
                const { put } = await import('@vercel/blob');
                const filename = `rules/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const blob = await put(filename, buffer, {
                    access: 'public',
                    contentType: 'application/pdf',
                });
                fileUrl = blob.url;
                console.log("[API] File saved to Vercel Blob:", fileUrl);
            } else {
                fileUrl = await saveToLocalFilesystem(buffer, file.name);
            }

            finalContent = ""; // PDF content is accessed via the URL
        }

        // Create rule
        const createData = {
            title,
            url: fileUrl,
            content: finalContent || null,
            category: category || null,
            description: description || null,
        };
        const rule = await db.ruleBook.create({
            data: createData as any,
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

// Helper function to save to local filesystem (async)
async function saveToLocalFilesystem(buffer: Buffer, filename: string): Promise<string> {
    const sanitizedFilename = `${Date.now()}-${filename.replace(/\s+/g, '-')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rules');

    await fs.mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, sanitizedFilename);
    await fs.writeFile(filePath, buffer);

    console.log("[API] File saved locally to:", filePath);
    return `/uploads/rules/${sanitizedFilename}`;
}
