import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
Sen Türkiye Basketbol Federasyonu (TBF) ve FIBA kuralları konusunda uzmanlaşmış bir yapay zeka asistanısın.
Adın "TBF Kural Asistanı".
Görevin, basketbol hakemlerine, aday hakemlere ve görevlilere kurallar, mekanikler ve talimatlar konusunda yardımcı olmaktır.

Aşağıdaki kurallara sıkı sıkıya bağlı kal:
1. Cevapların her zaman FIBA 2024 Resmi Basketbol Kuralları ve TBF Talimatlarına dayanmalıdır.
2. Emin olmadığın konularda spekülasyon yapma, "Bu konuda emin değilim, lütfen resmi kural kitabına bakınız" de.
3. Hakem mekanikleri (nerede durulmalı, nasıl işaret verilmeli) konusunda detaylı bilgi ver.
4. Karmaşık pozisyonları açıklarken senaryo üzerinden git.
5. Kullanıcıya her zaman nazik, profesyonel ve eğitici bir dille hitap et.
6. Cevaplarını kısa, öz ve madde madde vererek okunabilirliği artır.
`;

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, sessionId } = await req.json();

        if (!message) {
            return NextResponse.json({ error: "Message required" }, { status: 400 });
        }

        // Generate ID for session if new or use existing?
        // Logic: Frontend sends sessionId OR we create distinct one.
        // Or if we have a single continuous chat, we fetch/create it here.

        let chatSessionId = sessionId;
        let chatSession;

        if (chatSessionId) {
            chatSession = await db.chatSession.findUnique({ where: { id: chatSessionId } });
        } else {
            // Check for existing "active" session or just create new one
            // Let's create a new one if not provided
            chatSession = await db.chatSession.create({
                data: { userId: session.userId }
            });
            chatSessionId = chatSession.id;
        }

        if (!chatSession) return NextResponse.json({ error: "Session not found" }, { status: 404 });

        // Save User Message
        await db.message.create({
            data: {
                sessionId: chatSessionId,
                role: "user",
                content: message
            }
        });

        // Fetch history for context (last 10 messages)
        const history = await db.message.findMany({
            where: { sessionId: chatSessionId },
            orderBy: { createdAt: 'asc' },
            take: 10
        });

        const historyPrompt = history.map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join("\n");

        // Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent([
            SYSTEM_PROMPT,
            historyPrompt,
            `User: ${message}`,
            "Assistant:"
        ]);
        const responseText = result.response.text();

        // Save Assistant Message
        await db.message.create({
            data: {
                sessionId: chatSessionId,
                role: "assistant",
                content: responseText
            }
        });

        return NextResponse.json({ response: responseText, sessionId: chatSessionId });

    } catch (error) {
        console.error("AI Chat Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
