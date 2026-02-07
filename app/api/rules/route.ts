import { NextResponse } from "next/server";
import { db } from "@/lib/db";
const pdf = require("pdf-parse");

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
    try {
        const formData = await req.formData();
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "PDF dosyası gereklidir" }, { status: 400 });
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            return NextResponse.json({ error: "Sadece PDF dosyaları yüklenebilir" }, { status: 400 });
        }

        // Read file buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Extract text from PDF
        let extractedText = "";
        try {
            const pdfData = await pdf(buffer);
            extractedText = pdfData.text;
        } catch (pdfError) {
            console.error("PDF text extraction error:", pdfError);
            extractedText = "PDF içeriği okunamadı.";
        }

        // Save PDF file
        const fs = require('fs');
        const path = require('path');
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rules');

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const filePath = path.join(uploadDir, filename);
        fs.writeFileSync(filePath, buffer);
        const url = `/uploads/rules/${filename}`;

        // Create rule with extracted text
        const rule = await db.ruleBook.create({
            data: {
                title,
                url,
                content: extractedText,
                category,
                description
            }
        });

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error("Error saving rule:", error);
        return NextResponse.json({
            error: "İşlem başarısız.",
            details: error.message
        }, { status: 500 });
    }
}
