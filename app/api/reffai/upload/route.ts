import { NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import * as pdfParseAny from "pdf-parse";
const pdfParse = (pdfParseAny as any).default || pdfParseAny;

// Metni chunk'lara böl (her chunk ~800 karakter, 200 karakter örtüşme)
const splitTextIntoChunks = (text: string, chunkSize = 800, overlap = 200) => {
    const chunks: string[] = [];
    // Metni normalize et: fazla boşlukları temizle
    const cleanText = text.replace(/\s+/g, " ").trim();
    let i = 0;
    while (i < cleanText.length) {
        chunks.push(cleanText.slice(i, i + chunkSize).trim());
        i += chunkSize - overlap;
    }
    return chunks.filter(c => c.length > 10); // Çok kısa chunk'ları atla
};

export async function POST(req: Request) {
    try {
        const session = await verifySession();
        if (!session || (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && session.role !== "OBSERVER")) {
            return NextResponse.json({ error: "Sadece yöneticiler ve gözlemciler doküman yükleyebilir." }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;
        if (!file) {
            return NextResponse.json({ error: "Lütfen bir PDF dosyası seçin." }, { status: 400 });
        }

        // PDF'den metin çıkar
        const buffer = await file.arrayBuffer();
        const pdfData = await pdfParse(Buffer.from(buffer));
        const rawText = pdfData.text;

        if (!rawText || rawText.trim().length < 20) {
            return NextResponse.json({ error: "PDF içeriği okunamadı veya çok kısa." }, { status: 400 });
        }

        // Chunk'lara böl
        const chunks = splitTextIntoChunks(rawText);
        if (chunks.length === 0) {
            return NextResponse.json({ error: "PDF içeriği işlenemedi." }, { status: 400 });
        }

        // Önceki yüklemeyi sil (aynı dosya adıyla)
        await db.reffAIDocument.deleteMany({
            where: { fileName: file.name }
        });

        // Veritabanına kaydet
        await db.reffAIDocument.createMany({
            data: chunks.map((content, index) => ({
                fileName: file.name,
                chunkIndex: index,
                content: content
            }))
        });

        return NextResponse.json({
            success: true,
            message: `"${file.name}" başarıyla ReffAI hafızasına eklendi. (${chunks.length} bölüm)`
        });

    } catch (error) {
        console.error("PDF İşleme veya Yükleme Hatası:", error);
        return NextResponse.json({ error: "Doküman işlenirken sistem hatası oluştu." }, { status: 500 });
    }
}
