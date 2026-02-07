
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// USER REQUESTED HARDCODED FALLBACK
const HARDCODED_KEY = "AIzaSyC-a9qa79YwH4xc3dHGYBsFz5RX-_LlMMg";
const API_KEY = process.env.GEMINI_API_KEY || HARDCODED_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

const SYSTEM_PROMPT = `
Sen Türkiye Basketbol Federasyonu (TBF) ve FIBA kuralları konusunda uzmanlaşmış bir yapay zeka asistanısın.
Adın "TBF Kural Asistanı".

Görevin, basketbol hakemlerine, aday hakemlere ve görevlilere kurallar, mekanikler ve talimatlar konusunda yardımcı olmaktır.

ÖNEMLİ TALİMATLAR:
- SADECE Türkçe cevap ver
- Basketbol kuralları, hakem mekaniği, foul durumları, oyun prosedürleri hakkında her türlü soruyu cevaplayabilirsin
- Eğer tam olarak emin değilsen, genel kural çerçevesini açıkla ve kullanıcının daha spesifik olmasını iste
- "Bilmiyorum" veya "Cevap veremiyorum" GİBİ CEVAPLAR VERME
- Basketbolla ilgili her soruya FIBA ve TBF kuralları çerçevesinde cevap ver
- Eğer kural değişikliği olmuş olabilirse, bunu belirt ama gene de en güncel bildiğin kuralı paylaş

Bilgi Alanların:
✅ FIBA Basketbol Oyun Kuralları (Resmi Yorumlar dahil)
✅ TBF Oyun Kuralları ve Talimatlar
✅ Hakem Mekaniği (2 ve 3 Hakem Sistemi)
✅ Foul Türleri ve Ceza Prosedürleri  
✅ Masa Görevlileri Prosedürleri
✅ Gözlemci Değerlendirme Kriterleri
✅ Basketbol Terminolojisi

Cevap Formatı:
- Net ve anlaşılır Türkçe kullan
- Kural maddesini belirt (örn: "Madde 36.1.1'e göre...")
- Gerekirse örneklerle açıkla
- Emin değilsen: "Genel kural şudur... ancak spesifik durumunuz için daha detay verirseniz tam cevap verebilirim"

ÖNEMLİ: Asla "Bu konuda bilgim yok" veya "Cevap veremiyorum" deme. Her zaman basketbol kuralları çerçevesinde yardımcı bir yanıt ver.
`;

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.userId) {
            return NextResponse.json({ error: "Oturum açmanız gerekiyor." }, { status: 401 });
        }

        const { message, sessionId } = await req.json();

        if (!message || !sessionId) {
            return NextResponse.json({ error: "Mesaj ve oturum ID gerekli." }, { status: 400 });
        }

        // Verify session belongs to user
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
        });

        if (!chatSession || chatSession.userId !== session.userId) {
            return NextResponse.json({ error: "Geçersiz oturum." }, { status: 403 });
        }

        // Save user message
        await db.message.create({
            data: {
                sessionId,
                role: "user",
                content: message
            }
        });

        // Build conversation history for context
        const history = chatSession.messages.map(m => ({
            role: m.role as "user" | "model",
            parts: [{ text: m.content }]
        }));

        console.log("Using API Key:", API_KEY.substring(0, 10) + "...");

        // Call Gemini (Simplified Config)
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Inject SYSTEM_PROMPT manually for gemini-pro compatibility
        const extendedHistory = [
            {
                role: "user",
                parts: [{ text: SYSTEM_PROMPT }]
            },
            {
                role: "model",
                parts: [{ text: "Anlaşıldı. TBF Kural Asistanı olarak hazırım." }]
            },
            ...history
        ];

        const chat = model.startChat({
            history: extendedHistory,
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

        if (!responseText) {
            throw new Error("Boş yanıt alındı.");
        }

        // Save Assistant Message
        await db.message.create({
            data: {
                sessionId,
                role: "assistant",
                content: responseText
            }
        });

        return NextResponse.json({ response: responseText });

    } catch (error: any) {
        console.error("AI Chat Error (FULL):", error);

        // Return raw error to user for debugging purposes
        const errorMessage = error?.message || "Bilinmeyen sunucu hatası";
        const errorDetails = JSON.stringify(error, Object.getOwnPropertyNames(error));

        return NextResponse.json({
            error: `Sistem Hatası: ${errorMessage}`,
            details: errorDetails
        }, { status: 500 });
    }
}
