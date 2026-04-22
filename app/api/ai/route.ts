import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

interface ParsedRule {
    id: string;
    title: string;
    content: string;
    keywords: string[];
}

export async function POST(req: NextRequest) {
    // Only SUPER_ADMIN can use this endpoint
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Oturum açın." }, { status: 401 });
    }
    if (session.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Yetkiniz yok." }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });
    }

    let question: string;
    let topRules: ParsedRule[];

    try {
        const body = await req.json();
        question = body.question;
        topRules = body.topRules;
    } catch {
        return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }

    if (!question || !topRules?.length) {
        return NextResponse.json({ error: "Soru veya kural eksik." }, { status: 400 });
    }

    const rulesText = topRules
        .map((r, i) => `[Kural ${i + 1}: ${r.title}]\n${r.content}`)
        .join("\n\n---\n\n");

    const prompt = `Kullanıcının sorusu:\n${question}\n\nKurallar:\n${rulesText}\n\nKurallara göre cevap ver. Varsayım yapma. Sadece verilen kuralları kullan. Cevabı kısa ve maddeler halinde ver.`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 1024,
                    },
                }),
            }
        );

        if (!res.ok) {
            const err = await res.text();
            console.error("[AI /api/ai] Gemini error:", err);
            return NextResponse.json({ error: "AI yanıt vermedi." }, { status: 502 });
        }

        const data = await res.json();
        const answer = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!answer) {
            return NextResponse.json({ error: "AI boş yanıt döndürdü." }, { status: 502 });
        }

        return NextResponse.json({ answer });
    } catch (err: any) {
        console.error("[AI /api/ai] Fetch error:", err);
        return NextResponse.json({ error: "AI servisine ulaşılamadı." }, { status: 500 });
    }
}
