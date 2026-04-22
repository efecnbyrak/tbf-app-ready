import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from "@/lib/db";

/**
 * ReffAI v3 — Google Gemini ile Akıllı Asistan
 *
 * 1. Kullanıcının sorusundan anahtar kelimeler çıkar
 * 2. PostgreSQL'de ILIKE ile arama yap (reffai_documents tablosu)
 * 3. Bulunan chunk'ları Gemini'ye bağlam olarak gönder
 * 4. Güzel formatlı yanıt üret
 */

function getGemini() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY ortam değişkeni tanımlanmamış.");
    return new GoogleGenerativeAI(apiKey);
}

function extractKeywords(question: string): string[] {
    const stopWords = new Set([
        "bir", "bu", "şu", "o", "ve", "veya", "ya", "da", "de", "ile",
        "için", "mi", "mı", "mu", "mü", "ne", "nasıl", "nedir", "nelerdir",
        "kaç", "hangi", "kim", "neden", "niçin", "niye", "ise", "olarak",
        "gibi", "ama", "fakat", "ancak", "hem", "ben", "sen", "biz", "siz",
        "onlar", "bana", "sana", "beni", "seni", "var", "yok", "olan",
        "olur", "olursa", "dir", "dır", "den", "dan",
        "merhaba", "selam", "iyi", "günler", "teşekkür", "ederim",
        "lütfen", "acaba", "hakkında", "hakkinda"
    ]);

    const normalized = question.toLowerCase().trim();
    const words = normalized
        .split(/[\s,;:.!?\-()'"\/]+/)
        .filter(w => w.length >= 2 && !stopWords.has(w));

    return [...new Set(words)];
}

export async function askReffAI(question: string, history: any[] = []) {
    try {
        const keywords = extractKeywords(question);

        if (keywords.length === 0) {
            return {
                text: "Lütfen somut bir soru sorun. Örneğin: \"3 saniye kuralı nedir?\", \"Hatalı yürüme kuralı nasıl uygulanır?\" gibi."
            };
        }

        // PostgreSQL'de anahtar kelime araması
        const whereConditions = keywords.map(kw => ({
            content: {
                contains: kw,
                mode: "insensitive" as const
            }
        }));

        const matchedChunks = await db.reffAIDocument.findMany({
            where: { OR: whereConditions },
            orderBy: { chunkIndex: "asc" },
            take: 8
        });

        let context = "";
        if (matchedChunks.length === 0) {
            context = "Dokümanlarda bu konuyla doğrudan eşleşen bir bölüm bulunamadı. Genel basketbol hakemlik bilgilerinle yanıtla.";
        } else {
            context = matchedChunks
                .map(chunk => `[Kaynak: ${chunk.fileName}, Bölüm ${chunk.chunkIndex + 1}]\n${chunk.content}`)
                .join("\n\n---\n\n");
        }

        const systemPrompt = `Sen "ReffAI" adında, Türkiye Basketbol Federasyonu (TBF) ve FIBA kurallarında uzman, profesyonel bir yapay zeka hakem asistanısın.
Görevlerin:
1. Basketbol kuralları, hakemlik mekanikleri ve talimatlarla ilgili soruları yanıtlamak.
2. Eğer aşağıda "Sağlanan Dokümanlar" varsa oradaki bilgileri öncelikli olarak kullanmak.
3. Eğer dokümanlarda bilgi yoksa, genel basketbol hakemlik bilgilerinle yardımcı olmak.
4. Eğitici, net ve madde imli bir dil kullanmak.
5. Yanıtlarını Türkçe ver.

${context ? `Sağlanan Dokümanlar:\n${context}` : "Şu an için özel bir eğitim dokümanı sağlanmadı, genel bilginle yanıt ver."}`;

        const genAI = getGemini();
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(question);
        const text = result.response.text();

        return { text: text || "Cevap üretilemedi." };

    } catch (error) {
        console.error("ReffAI Orchestration Error:", error);
        throw new Error((error as any).message || "ReffAI cevap veremedi.");
    }
}
