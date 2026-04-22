import { OpenAI } from "openai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Sen Basketbol Koordinasyon Sistemi (BKS) ve genel basketbol kuralları konusunda uzmanlaşmış bir yapay zeka asistanısın. Adın "BKS Kural Asistanı". Görevin kullanıcılara yardımcı olmaktır. Sadece Türkçe cevap ver.`;

export const maxDuration = 60; // Allow longer duration

export async function POST(req: NextRequest) {
    try {
        // Authentication Check
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ error: "Oturum açın." }, { status: 401 });

        const { message, sessionId } = await req.json();
        if (!message || !sessionId) return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });

        // Verify session
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 10 } }
        });

        if (!chatSession || chatSession.userId !== session.userId) return NextResponse.json({ error: "Geçersiz." }, { status: 403 });

        // Start saving User Message concurrently with OpenAI request
        const userMessagePromise = db.message.create({ data: { sessionId, role: "user", content: message } });

        // Build History for OpenAI
        const history: any[] = chatSession.messages.map(m => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content
        }));

        const openaiMessages = [
            { role: "system", content: SYSTEM_PROMPT },
            ...history,
            { role: "user", content: message }
        ];

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Fetch from OpenAI and await DB save in parallel to reduce overall latency
        const [completion] = await Promise.all([
            openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: openaiMessages as any,
                temperature: 0.7,
                max_tokens: 1000,
            }),
            userMessagePromise
        ]);

        const responseText = completion.choices[0].message.content;

        if (!responseText) throw new Error("Boş yanıt.");

        // Save Assistant Message
        await db.message.create({ data: { sessionId, role: "assistant", content: responseText } });

        return NextResponse.json({ response: responseText });

    } catch (error: any) {
        console.error("AI FATAL ERROR:", error);
        return NextResponse.json({
            error: "Yapay zeka şu an meşgul, lütfen tekrar deneyin.",
            details: error?.message
        }, { status: 500 });
    }
}
