import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/login");

    // Fetch or create latest session for simpler UI (Single Thread)
    // We get the most recent session
    let chatSession = await db.chatSession.findFirst({
        where: { userId: session.userId },
        orderBy: { updatedAt: 'desc' },
        include: { messages: { orderBy: { createdAt: 'asc' } } }
    });

    if (!chatSession) {
        // We will create it on client side first message? 
        // Or create fetch API?
        // Let's passed empty messages and let API create session if missing
    }

    return (
        <div className="container mx-auto p-4 max-w-4xl h-full">
            <ChatInterface
                initialMessages={chatSession?.messages.map(m => ({
                    ...m,
                    createdAt: m.createdAt, // Ensure it's passed as Date
                    role: m.role as "user" | "assistant"
                })) || []}
                sessionId={chatSession?.id || ""}
                userId={session.userId}
            />
        </div>
    );
}
