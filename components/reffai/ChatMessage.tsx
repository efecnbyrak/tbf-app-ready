import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
    role: "user" | "assistant";
    content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === "user";

    return (
        <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4`}>
            <div className={`flex max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"} items-start gap-4`}>

                {/* Avatar */}
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${isUser
                    ? "bg-red-600 text-white"
                    : "bg-indigo-600 text-white"
                    }`}>
                    {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble */}
                <div className={`
                    p-4 rounded-2xl text-sm leading-relaxed shadow-sm
                    ${isUser
                        ? "bg-red-600 text-white rounded-tr-none"
                        : "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-100 dark:border-zinc-700/50 rounded-tl-none"
                    }
                `}>
                    <div className={`prose dark:prose-invert max-w-none ${isUser ? "prose-p:text-white" : ""}`}>
                        <ReactMarkdown>
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>

            </div>
        </div>
    );
}
