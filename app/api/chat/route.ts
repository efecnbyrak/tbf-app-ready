
import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

// 3. Secure backend setup: Get API Key from Environment
const API_KEY = process.env.GEMINI_API_KEY;

// 1. Initialize Gemini Client
const genAI = new GoogleGenerativeAI(API_KEY || "");

// System Prompt for TBF Context
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

export const maxDuration = 30; // Vercel timeout protection (30s)

export async function POST(req: NextRequest) {
    try {
        // 5. Error Handling: Check for API Key
        if (!API_KEY) {
            console.error("[GEMINI ERROR] API Key is missing in environment variables.");
            return NextResponse.json({
                error: "Sistem yapılandırma hatası. (API Key Eksik)"
            }, { status: 500 });
        }

        // Authentication Check
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

        // Save User Message to DB
        await db.message.create({
            data: {
                sessionId,
                role: "user",
                content: message
            }
        });

        // Build History for Context
        // Note: We inject System Prompt manually for better compatibility across models
        const history = chatSession.messages.map(m => ({
            role: m.role === "admin" ? "model" : (m.role === "assistant" ? "model" : "user"),
            parts: [{ text: m.content }]
        }));

        const chatHistory = [
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

        // 2 & 7. Use 'gemini-1.5-flash' for performance and stability
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 1000, // 7. Limit output for performance
            },
        });

        // 6. Timeout Protection (Manual race)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 25000)
        );

        const resultPromise = chat.sendMessage(message);

        // Race against timeout
        const result = await Promise.race([resultPromise, timeoutPromise]) as any;

        const responseText = result.response.text();

        if (!responseText) {
            throw new Error("Boş yanıt alındı.");
        }

        // Save Assistant Message to DB
        await db.message.create({
            data: {
                sessionId,
                role: "assistant",
                content: responseText
            }
        });

        return NextResponse.json({ response: responseText });

    } catch (error: any) {
        console.error("[GEMINI API ERROR]", error);

        // 5. Error Handling Logic
        let userMessage = "Üzgünüm, şu anda yanıt veremiyorum.";
        let statusCode = 500;

        if (error.message.includes("404")) {
            console.error("Model bulunamadı (404). Model ismini veya API versiyonunu kontrol edin.");
        } else if (error.message.includes("400")) {
            console.error("Geçersiz istek (400). Parametreleri kontrol edin.");
        } else if (error.message.includes("API key")) {
            console.error("API Key hatası.");
        } else if (error.message.includes("timed out")) {
            console.error("Zaman aşımı.");
        }

        // Always return generic message to user, but log details on server
        return NextResponse.json({
            error: userMessage,
            details: error.message // Frontend can choose to show this or not
        }, { status: statusCode });
    }
}
