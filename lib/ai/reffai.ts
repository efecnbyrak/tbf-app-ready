import { getOpenAI } from "./vectorStore";
import { db } from "@/lib/db";

/**
 * ReffAI v2 — Akıllı Asistan
 * 
 * 1. Kullanıcının sorusundan anahtar kelimeler çıkar
 * 2. PostgreSQL'de ILIKE ile arama yap (reffai_documents tablosu)
 * 3. Bulunan chunk'ları OpenAI'ya bağlam olarak gönder
 * 4. Güzel formatlı yanıt üret
 */

function extractKeywords(question: string): string[] {
    // Türkçe stop words (anlamsız kelimeler) - bunları aramada kullanmıyoruz
    const stopWords = new Set([
        "bir", "bu", "şu", "o", "ve", "veya", "ya", "da", "de", "ile",
        "için", "mi", "mı", "mu", "mü", "ne", "nasıl", "nedir", "nelerdir",
        "kaç", "hangi", "kim", "neden", "niçin", "niye", "ise", "olarak",
        "gibi", "ama", "fakat", "ancak", "hem", "ben", "sen", "biz", "siz",
        "onlar", "bana", "sana", "beni", "seni", "var", "yok", "olan",
        "olur", "olursa", "olan", "olan", "dir", "dır", "den", "dan",
        "merhaba", "selam", "iyi", "günler", "teşekkür", "ederim",
        "lütfen", "acaba", "hakkında", "hakkinda"
    ]);

    // Soruyu küçük harfe çevir, Türkçe karakterleri koru
    const normalized = question.toLowerCase().trim();

    // Kelimelere ayır ve stop word'leri filtrele
    const words = normalized
        .split(/[\s,;:.!?\-()'"\/]+/)
        .filter(w => w.length >= 2 && !stopWords.has(w));

    return [...new Set(words)]; // Benzersiz kelimeler
}

export async function askReffAI(question: string, history: any[] = []) {
    try {
        // 1. Doküman var mı kontrol et (Eskisi gibi hata döndürmüyoruz, sadece bağlamı boş bırakıyoruz)
        const docCount = await db.reffAIDocument.count();

        // 2. Anahtar kelimeler çıkar
        const keywords = extractKeywords(question);

        if (keywords.length === 0) {
            return {
                text: "Lütfen somut bir soru sorun. Örneğin: \"3 saniye kuralı nedir?\", \"Hatalı yürüme kuralı nasıl uygulanır?\" gibi."
            };
        }

        // 3. PostgreSQL'de arama yap — her anahtar kelime ile ILIKE sorgusu
        // OR mantığıyla: herhangi bir anahtar kelime eşleşirse getir
        const whereConditions = keywords.map(kw => ({
            content: {
                contains: kw,
                mode: "insensitive" as const
            }
        }));

        const matchedChunks = await db.reffAIDocument.findMany({
            where: {
                OR: whereConditions
            },
            orderBy: { chunkIndex: "asc" },
            take: 8 // En fazla 8 chunk al (yeterli bağlam)
        });

        // 4. Eşleşme yoksa genel bilgiyle yanıtla
        let context = "";
        if (matchedChunks.length === 0) {
            context = "Dokümanlarda bu konuyla doğrudan eşleşen bir bölüm bulunamadı. Genel basketbol hakemlik bilgilerinle yanıtla.";
        } else {
            context = matchedChunks
                .map((chunk, i) => `[Kaynak: ${chunk.fileName}, Bölüm ${chunk.chunkIndex + 1}]\n${chunk.content}`)
                .join("\n\n---\n\n");
        }


        // 6. OpenAI ile güzel formatlı yanıt üret
        const openai = getOpenAI();
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `Sen "ReffAI" adında, Türkiye Basketbol Federasyonu (TBF) ve FIBA kurallarında uzman, profesyonel bir yapay zeka hakem asistanısın.
Görevlerin:
1. Basketbol kuralları, hakemlik mekanikleri ve talimatlarla ilgili soruları yanıtlamak.
2. Eğer aşağıda "Sağlanan Dokümanlar" varsa oradaki bilgileri öncelikli olarak kullanmak.
3. Eğer dokümanlarda bilgi yoksa, genel basketbol hakemlik bilgilerinle yardımcı olmak.
4. Eğitici, net ve madde imli bir dil kullanmak.
5. Yanıtlarını Türkçe ver.

${context ? `Sağlanan Dokümanlar:\n${context}` : "Şu an için özel bir eğitim dokümanı sağlanmadı, genel bilginle yanıt ver."}`
                },
                {
                    role: "user",
                    content: question
                }
            ],
            temperature: 0.1,
        });

        return { text: response.choices[0].message.content || "Cevap üretilemedi." };

    } catch (error) {
        console.error("ReffAI Orchestration Error:", error);
        throw new Error((error as any).message || "ReffAI cevap veremedi.");
    }
}
