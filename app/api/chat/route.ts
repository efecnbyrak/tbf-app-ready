import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `Sen Basketbol Koordinasyon Sistemi (BKS) ve genel basketbol kuralları konusunda uzmanlaşmış bir yapay zeka asistanısın. Adın "BKS Kural Asistanı". Görevin kullanıcılara yardımcı olmaktır. Sadece Türkçe cevap ver.`;

export const maxDuration = 60;

function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY ortam değişkeni tanımlanmamış.");
    return new GoogleGenerativeAI(apiKey);
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) return NextResponse.json({ error: "Oturum açın." }, { status: 401 });

        const { message, sessionId } = await req.json();
        if (!message || !sessionId) return NextResponse.json({ error: "Eksik parametre." }, { status: 400 });

        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: "asc" }, take: 10 } }
        });

        if (!chatSession || chatSession.userId !== session.userId)
            return NextResponse.json({ error: "Geçersiz." }, { status: 403 });

        const userMessagePromise = db.message.create({ data: { sessionId, role: "user", content: message } });

        const history = chatSession.messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
        }));

        const genAI = getGemini();
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_PROMPT,
        });

        const chat = model.startChat({ history });

        const [result] = await Promise.all([
            chat.sendMessage(message),
            userMessagePromise
        ]);

        const responseText = result.response.text();

        if (!responseText) throw new Error("Boş yanıt.");

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
