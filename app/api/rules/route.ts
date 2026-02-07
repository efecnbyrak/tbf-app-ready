import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { put } from '@vercel/blob';

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
        console.log("[API] FormData received");

        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;
        const file = formData.get("file") as File;

        console.log("[API] Form fields:", { title, category, description, hasFile: !!file });

        if (!file) {
            console.error("[API] No file provided");
            return NextResponse.json({ error: "PDF dosyası gereklidir" }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            console.error("[API] File is not a PDF:", file.name);
            return NextResponse.json({ error: "Sadece PDF dosyaları yüklenebilir" }, { status: 400 });
        }

        console.log("[API] File received:", file.name, file.size, "bytes");

        // Read file buffer
        const buffer = Buffer.from(await file.arrayBuffer());
        console.log("[API] Buffer created, size:", buffer.length);

        // Extract text from PDF
        let extractedText = "";
        try {
            console.log("[API] Starting PDF text extraction...");
            const pdf = require("pdf-parse");
            const pdfData = await pdf(buffer);
            extractedText = pdfData.text;
            console.log("[API] PDF text extracted, length:", extractedText.length);
        } catch (pdfError) {
            console.error("[API] PDF text extraction error:", pdfError);
            extractedText = "PDF içeriği okunamadı.";
        }

        // Upload to Vercel Blob Storage (works in serverless environment)
        const filename = `rules/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        console.log("[API] Uploading to Vercel Blob Storage:", filename);

        const blob = await put(filename, buffer, {
            access: 'public',
            contentType: 'application/pdf',
        });

        console.log("[API] File uploaded to Blob Storage:", blob.url);

        // Create rule with extracted text
        const rule = await db.ruleBook.create({
            data: {
                title,
                url: blob.url, // Vercel Blob URL
                content: extractedText,
                category,
                description
            }
        });

        console.log("[API] Rule created in database:", rule.id);

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error("[API] Error saving rule:", error);
        return NextResponse.json({
            error: "İşlem başarısız.",
            details: error.message
        }, { status: 500 });
    }
}
