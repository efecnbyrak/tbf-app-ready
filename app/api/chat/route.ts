
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 1. Initialize Gemini Client with Robust Fallback (Hardcoded Key)
// Use process.env if available, otherwise use hardcoded key
const BACKUP_KEY = "AIzaSyC-a9qa79YwH4xc3dHGYBsFz5RX-_LlMMg";
const API_KEY = process.env.GEMINI_API_KEY || BACKUP_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `Sen Türkiye Basketbol Federasyonu (TBF) ve FIBA kuralları konusunda uzmanlaşmış bir yapay zeka asistanısın. Adın "TBF Kural Asistanı". Görevin hakemlere yardımcı olmaktır. Sadece Türkçe cevap ver.`;

export const maxDuration = 60; // Allow longer duration

export async function POST(req: NextRequest) {
    try {
        console.log(`[GEMINI API] Key Used: ${API_KEY.substring(0, 10)}...`);

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

        // Save User Message
        await db.message.create({ data: { sessionId, role: "user", content: message } });

        // Build History
        const history = chatSession.messages.map(m => ({
            role: m.role === "assistant" || m.role === "model" ? "model" : "user",
            parts: [{ text: m.content }]
        }));

        // Inject System as History (Most reliable method)
        // This works for gemini-1.5-flash perfectly without needing systemInstruction config
        const chatHistory = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: "model",
                parts: [{ text: "Anlaşıldı." }]
            },
            ...history
        ];

        // STRICTLY USE GEMINI-1.5-FLASH (No fallback)
        console.log("[GEMINI] Using strict model: gemini-1.5-flash");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 1000,
                temperature: 0.7
            },
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

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
