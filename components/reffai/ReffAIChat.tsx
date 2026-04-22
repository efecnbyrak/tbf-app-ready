"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, Trash2 } from "lucide-react";
import { ChatMessage } from "./ChatMessage";

interface Message {
    role: "user" | "assistant";
    content: string;
}

export function ReffAIChat() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "Merhaba! Ben ReffAI. Eğitim dokümanlarına ve kurallara dayanarak hakemlik hakkında aklınıza takılan tüm soruları bana sorabilirsiniz."
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: input };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/reffai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            if (!response.ok) throw new Error("API Hatası");

            // We are using LangChain streaming or standard response
            const data = await response.json();

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: data.text }
            ]);

        } catch (error) {
            console.error("ReffAI Error:", error);
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin." }
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: "assistant",
                content: "Merhaba! Ben ReffAI. Sistem dokümanlarına ve kurallara dayanarak sorularınızı yanıtlamak için buradayım."
            }
        ]);
    };

    return (
        <div className="flex flex-col h-[75vh] min-h-[500px] bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white leading-tight uppercase italic">ReffAI Asistan</h2>
                        <p className="text-[10px] text-zinc-500 font-bold tracking-widest uppercase">Akıllı Hakem Destek Sistemi</p>
                    </div>
                </div>
                <button
                    onClick={clearChat}
                    className="p-2 text-zinc-400 hover:text-red-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Sohbeti Temizle"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Chat Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/chat-bg.png')] dark:bg-none bg-repeat bg-opacity-50"
            >
                {messages.map((msg, idx) => (
                    <ChatMessage key={idx} role={msg.role} content={msg.content} />
                ))}

                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="flex items-center gap-4 max-w-[85%]">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none shadow-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                                <span className="text-xs text-zinc-500 font-medium italic">ReffAI düşünüyor...</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Örn: Hatalı yürüme kuralı nedir?"
                        className="flex-1 px-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 text-sm transition-shadow dark:text-white"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center justify-center min-w-[50px]"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[9px] text-zinc-400 italic">ReffAI bazen hata yapabilir. Lütfen önemli bilgileri resmi dokümanlardan doğrulayın.</span>
                </div>
            </div>
        </div>
    );
}
