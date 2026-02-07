import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { message, sessionId } = await req.json();

        if (!message || !sessionId) {
            return NextResponse.json({ error: "Message and sessionId required" }, { status: 400 });
        }

        // Verify session belongs to user
        const chatSession = await db.chatSession.findUnique({
            where: { id: sessionId },
            include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
        });

        if (!chatSession || chatSession.userId !== session.userId) {
            return NextResponse.json({ error: "Invalid session" }, { status: 403 });
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

        // Add current user message
        history.push({
            role: "user",
            parts: [{ text: message }]
        });

        // Call Gemini with improved config
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                temperature: 0.7,
                topP: 0.9,
                maxOutputTokens: 2048,
            }
        });

        const chat = model.startChat({
            history: history.slice(0, -1), // Exclude last message as it will be sent separately
            systemInstruction: SYSTEM_PROMPT
        });

        const result = await chat.sendMessage(message);
        const responseText = result.response.text();

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
        console.error("AI Chat Error:", error);

        // More helpful error messaging
        const errorMessage = error?.message || "Bir hata oluştu";
        return NextResponse.json({
            error: "AI yanıt oluşturamadı. Lütfen tekrar deneyin.",
            details: errorMessage
        }, { status: 500 });
    }
}
