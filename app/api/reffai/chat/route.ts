import { NextResponse } from "next/server";
import { askReffAI } from "@/lib/ai/reffai";

export async function POST(req: Request) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json({ error: "Mesaj bulunamadı." }, { status: 400 });
        }

        // We only care about the last user question for RAG search
        const lastMessage = messages[messages.length - 1];

        if (lastMessage.role !== "user") {
            return NextResponse.json({ error: "Geçersiz mesaj akışı." }, { status: 400 });
        }

        // We can pass the history to the agent if needed. Currently passing the specific question.
        const answer = await askReffAI(lastMessage.content, messages);

        return NextResponse.json(answer);

    } catch (error) {
        console.error("ReffAI Chat API Error:", error);
        return NextResponse.json({ error: "Sistem hatası" }, { status: 500 });
    }
}
