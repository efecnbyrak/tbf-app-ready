"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User as UserIcon, Loader2, Sparkles, Trash2 } from "lucide-react";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    createdAt: Date | string;
}

interface ChatInterfaceProps {
    initialMessages: Message[];
    sessionId: string;
    userId: number;
}

export function ChatInterface({ initialMessages, sessionId, userId }: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [currentSessionId, setCurrentSessionId] = useState(sessionId);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
            createdAt: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userMessage.content, sessionId: currentSessionId })
            });

            if (!res.ok) throw new Error("Failed to send message");

            const data = await res.json();

            if (data.sessionId) {
                setCurrentSessionId(data.sessionId);
            }

            const botMessage: Message = {
                id: Date.now().toString() + "_bot",
                role: "assistant",
                content: data.response || "Bir hata oluştu.",
                createdAt: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, {
                id: Date.now().toString() + "_error",
                role: "assistant",
                content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
                createdAt: new Date().toISOString()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
                        <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="font-bold text-zinc-900 dark:text-zinc-100">TBF Kural Asistanı</h2>
                        <p className="text-xs text-zinc-500 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Gemini AI ile güçlendirildi
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-950">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 space-y-4">
                        <Bot className="w-16 h-16 opacity-20" />
                        <div>
                            <p className="font-semibold text-lg">Merhaba!</p>
                            <p className="text-sm max-w-xs mx-auto mt-2">
                                Ben senin kişisel kural asistanınım. FIBA kuralları, hakem mekanikleri veya maç yönetimi hakkında bana her şeyi sorabilirsin.
                            </p>
                            <div className="mt-6 grid gap-2">
                                <button onClick={() => setInput("Sportmenlik dışı faulün kriterleri nelerdir?")} className="text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-full border border-zinc-200 hover:border-indigo-300 transition-colors">
                                    "Sportmenlik dışı faulün kriterleri nelerdir?"
                                </button>
                                <button onClick={() => setInput("Şut saatini ne zaman 14'e resetlemeliyim?")} className="text-xs bg-white dark:bg-zinc-900 px-3 py-2 rounded-full border border-zinc-200 hover:border-indigo-300 transition-colors">
                                    "Şut saatini ne zaman 14'e resetlemeliyim?"
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-red-100 dark:bg-red-900/20" : "bg-indigo-100 dark:bg-indigo-900/20"}`}>
                            {msg.role === "user" ? <UserIcon className="w-5 h-5 text-red-600" /> : <Bot className="w-5 h-5 text-indigo-600" />}
                        </div>

                        <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user"
                            ? "bg-red-600 text-white rounded-tr-none shadow-md"
                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-tl-none shadow-sm text-zinc-800 dark:text-zinc-200"
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 mr-auto max-w-[85%]">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                            <span className="text-xs text-zinc-500">Yazıyor...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
                <div className="flex gap-2 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Bir soru sor..."
                        className="flex-1 bg-zinc-100 dark:bg-zinc-950 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none pr-12 dark:text-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="absolute right-2 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-[10px] text-zinc-400 text-center mt-2">
                    Yapay zeka hatalı bilgi verebilir. Lütfen kritik kararlar için resmi kural kitabına başvurunuz.
                </p>
            </form>
        </div>
    );
}
