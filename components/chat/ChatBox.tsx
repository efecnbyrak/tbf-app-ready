"use client";

import { useState, useEffect, useRef } from "react";
import { sendMessage, getMessages } from "@/app/actions/chat";
import { Send, User as UserIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: Date;
}

interface ChatBoxProps {
    currentUser: { id: number; name: string };
    otherUser: { id: number; name: string; role: string } | null;
}

export function ChatBox({ currentUser, otherUser }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (otherUser) {
            loadMessages();

            const handleVisibilityChange = () => {
                if (document.visibilityState === 'visible') {
                    loadMessages();
                }
            };

            document.addEventListener('visibilitychange', handleVisibilityChange);

            const interval = setInterval(() => {
                if (document.visibilityState === 'visible') {
                    loadMessages();
                }
            }, 5000); // Poll for new messages every 5 seconds

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                clearInterval(interval);
            };
        }
    }, [otherUser]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    async function loadMessages() {
        if (!otherUser) return;
        const msgs = await getMessages(otherUser.id);
        setMessages(msgs as any);
    }

    async function handleSendMessage(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim() || !otherUser || isSending) return;

        setIsSending(true);
        const result = await sendMessage(otherUser.id, newMessage);
        if (result.success) {
            setNewMessage("");
            loadMessages();
        }
        setIsSending(false);
    }

    if (!otherUser) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <UserIcon className="w-8 h-8 opacity-20" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">Sohbet Başlatın</h3>
                <p className="max-w-xs text-sm">Soldaki listeden birini seçerek mesajlaşmaya başlayabilirsiniz.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden h-full">
            {/* Header */}
            <div className="p-4 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                    {otherUser.name.charAt(0)}
                </div>
                <div>
                    <h3 className="font-bold text-zinc-900 dark:text-white leading-none mb-1">{otherUser.name}</h3>
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider bg-zinc-200 dark:bg-zinc-700 px-2 py-0.5 rounded">
                        {otherUser.role}
                    </span>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[url('/chat-bg.png')] bg-repeat"
            >
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`
                            max-w-[80%] p-3 rounded-2xl shadow-sm
                            ${msg.senderId === currentUser.id
                                ? 'bg-red-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700 rounded-tl-none'}
                        `}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <span className={`text-[10px] block mt-1 opacity-70 ${msg.senderId === currentUser.id ? 'text-right' : 'text-left'}`}>
                                {format(new Date(msg.createdAt), 'HH:mm', { locale: tr })}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t dark:border-zinc-800 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Mesajınızı yazın..."
                    className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg shadow-red-600/20"
                >
                    {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
            </form>
        </div>
    );
}
