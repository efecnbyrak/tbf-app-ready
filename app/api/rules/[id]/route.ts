import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import fs from "fs/promises";
import path from "path";

export const dynamic = 'force-dynamic';

// PUT /api/rules/[id]
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);

        const formData = await req.formData();
        const title = formData.get("title") as string;
        const category = formData.get("category") as string;
        const description = formData.get("description") as string;
        const type = formData.get("type") as string;

        let updateData: Record<string, any> = {
            title,
            category: category || null,
            description: description || null,
        };

        if (type === "JSON") {
            const jsonContent = formData.get("jsonContent") as string;
            updateData.content = jsonContent;
            updateData.url = null; // Clear PDF URL if switching to JSON
        } else if (type === "PDF") {
            const file = formData.get("file") as File | null;
            if (file && file.size > 0) {
                // New file uploaded — save it
                const buffer = Buffer.from(await file.arrayBuffer());
                const hasBlob = process.env.BLOB_READ_WRITE_TOKEN;
                if (hasBlob) {
                    const { put } = await import('@vercel/blob');
                    const filename = `rules/${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                    const blob = await put(filename, buffer, {
                        access: 'public',
                        contentType: 'application/pdf',
                    });
                    updateData.url = blob.url;
                } else {
                    const sanitizedFilename = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
                    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'rules');
                    await fs.mkdir(uploadDir, { recursive: true });
                    const filePath = path.join(uploadDir, sanitizedFilename);
                    await fs.writeFile(filePath, buffer);
                    updateData.url = `/uploads/rules/${sanitizedFilename}`;
                }
                updateData.content = "";
            }
            // If no new file, keep existing url/content as-is
        }

        const rule = await db.ruleBook.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(rule);
    } catch (error: any) {
        console.error("[API PUT /api/rules/[id]] Error:", error);
        return NextResponse.json({ error: "İşlem başarısız.", details: error.message }, { status: 500 });
    }
}

// DELETE /api/rules/[id]
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const id = parseInt(params.id);
        await db.ruleBook.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API DELETE /api/rules/[id]] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
