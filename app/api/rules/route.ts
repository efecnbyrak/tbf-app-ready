import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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
        const contentType = req.headers.get("content-type") || "";

        let title, url, category, description;

        if (contentType.includes("multipart/form-data")) {
            const formData = await req.formData();
            title = formData.get("title") as string;
            category = formData.get("category") as string;
            description = formData.get("description") as string;

            const file = formData.get("file") as File;
            const externalUrl = formData.get("url") as string;

            if (file) {
                // File Upload Logic
                const buffer = Buffer.from(await file.arrayBuffer());
                const filename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                const fs = require('fs');
                const path = require('path');

                // Ensure directory exists
                const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rules');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }

                const filePath = path.join(uploadDir, filename);
                fs.writeFileSync(filePath, buffer);
                url = `/uploads/rules/${filename}`;
            } else {
                url = externalUrl;
            }
        } else {
            // JSON Logic (Legacy)
            const body = await req.json();
            title = body.title;
            url = body.url;
            category = body.category;
            description = body.description;
        }

        const rule = await db.ruleBook.create({
            data: {
                title,
                url,
                category,
                description
            }
        });

        return NextResponse.json(rule);
    } catch (error) {
        console.error("Error saving rule:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
