import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

const PDF_FILES: Record<string, string> = {
    kural: "Basketbol Oyun Kuralları 2022.v.1.2.pdf",
    yorum: "Basketbol Oyun Kuralları Resmi Yorumlar.v4.1.pdf",
};

export async function GET(req: NextRequest) {
    const type = req.nextUrl.searchParams.get('type') || '';
    const filename = PDF_FILES[type];

    if (!filename) {
        return NextResponse.json({ error: 'Geçersiz tür' }, { status: 400 });
    }

    try {
        const filePath = path.join(process.cwd(), 'data', 'gameRules', filename);
        const buffer = await fs.readFile(filePath);

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(filename)}`,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
                'X-Content-Type-Options': 'nosniff',
            },
        });
    } catch {
        return NextResponse.json({ error: 'PDF bulunamadı' }, { status: 404 });
    }
}
