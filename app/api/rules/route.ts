import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Force dynamic rendering to avoid build-time errors with pdf-parse
export const dynamic = 'force-dynamic';

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
    console.log("[API /api/rules POST] Request received");
    try {
        const formData = await req.formData();
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as string; // "PDF" or "JSON"

        let fileUrl: string | null = null;
        let finalContent: string = "";

        if (type === "JSON") {
            finalContent = formData.get("jsonContent") as string;
            console.log("[API] JSON content received, length:", finalContent.length);
        } else {
            // Handle PDF
            const file = formData.get("file") as File;
            if (!file) {
                return NextResponse.json({ error: "PDF dosyası gereklidir" }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());

            // Extract text for searchability if needed (optional for PDF if we have JSON now, but good to keep)
            try {
                const pdf = require("pdf-parse");
                const pdfData = await pdf(buffer);
                finalContent = pdfData.text;
            } catch (pdfError) {
                console.error("[API] PDF extraction failed:", pdfError);
                finalContent = "PDF içeriği okunamadı.";
            }

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
            } else {
                fileUrl = await saveToLocalFilesystem(buffer, file.name);
            }
        }

        // Create rule
        const rule = await db.ruleBook.create({
            data: {
                title,
                url: fileUrl,
                content: finalContent,
                category,
                description
            }
        });

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error("[API] Error saving rule:", error);
        return NextResponse.json({
            error: "İşlem başarısız.",
            details: error.message
        }, { status: 500 });
    }
}

// Helper function to save to local filesystem
async function saveToLocalFilesystem(buffer: Buffer, filename: string): Promise<string> {
    const fs = require('fs');
    const path = require('path');
    const sanitizedFilename = `${Date.now()}-${filename.replace(/\s+/g, '-')}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rules');

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, sanitizedFilename);
    fs.writeFileSync(filePath, buffer);
    const url = `/uploads/rules/${sanitizedFilename}`;

    console.log("[API] File saved locally to:", filePath);
    return url;
}
