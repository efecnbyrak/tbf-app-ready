"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { sendMessage, getMessages, getChatUsers, getUnreadCount, deleteConversation, searchUsers } from "@/app/actions/chat";
import { MessageSquare, X, Send, Search, User as UserIcon, Trash2, Bell, Minus, Maximize2, Loader2, Sparkles, ArrowLeft, AlertTriangle, Plus } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface User {
    id: number;
    name: string;
    role: string;
    imageUrl?: string | null;
    city?: string | null;
    hasUnread?: boolean;
}

interface Message {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    createdAt: Date;
}

export function FloatingChat({ currentUserId, currentUserName }: { currentUserId: number, currentUserName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [view, setView] = useState<'users' | 'chat'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    const checkUnread = useCallback(async () => {
        const count = await getUnreadCount();
        if (count > unreadCount) {
            const audio = new Audio('/notif.mp3');
            audio.play().catch(() => { });
        }
        setUnreadCount(count);
    }, [unreadCount]);

    const loadUsers = useCallback(async () => {
        const data = await getChatUsers(true); // Only active chats
        setUsers(data as any);
    }, []);

    const performSearch = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        const results = await searchUsers(term);
        setSearchResults(results as any);
        setIsSearching(false);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (isSearchMode && searchTerm) {
                performSearch(searchTerm);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, isSearchMode, performSearch]);

    const loadMessages = useCallback(async (otherId: number, silent = false) => {
        if (!silent) setIsLoading(true);
        const msgs = await getMessages(otherId);
        setMessages(msgs as any);
        if (!silent) setIsLoading(false);
    }, []);

    // Initial load and polling with Page Visibility API optimization
    useEffect(() => {
        loadUsers();
        checkUnread();

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkUnread();
                if (isOpen && !isMinimized && view === 'chat' && selectedUser) {
                    loadMessages(selectedUser.id, true);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        pollingRef.current = setInterval(() => {
            // Skip polling if tab is not visible
            if (document.visibilityState !== 'visible') return;

            checkUnread();
            if (isOpen && !isMinimized && view === 'chat' && selectedUser) {
                loadMessages(selectedUser.id, true);
            }
        }, 5000); // Increased polling interval slightly for better performance

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (pollingRef.current) clearInterval(pollingRef.current);
        };
    }, [isOpen, isMinimized, view, selectedUser, checkUnread, loadUsers, loadMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSelectUser = async (user: User) => {
        setSelectedUser(user);
        setView('chat');
        setIsSearchMode(false);
        setSearchTerm("");
        await loadMessages(user.id);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser || isSending) return;

        setIsSending(true);
        const contentSnapshot = newMessage;
        setNewMessage(""); // Optimistic clear

        const result = await sendMessage(selectedUser.id, contentSnapshot);
        if (result.success) {
            await loadMessages(selectedUser.id, true);
        } else {
            setNewMessage(contentSnapshot); // Restore on failure
        }
        setIsSending(false);
    };

    const confirmDeleteChat = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        const result = await deleteConversation(selectedUser.id);
        if (result.success) {
            setMessages([]);
            setView('users');
            setSelectedUser(null);
            setShowDeleteConfirm(false);
            loadUsers();
        }
        setIsLoading(false);
    };

    const filteredUsers = useMemo(() => {
        return users.filter(u =>
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.role.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 z-50 group border-4 border-white dark:border-zinc-800"
                >
                    {unreadCount > 0 ? <Bell className="w-8 h-8 animate-ring" /> : <MessageSquare className="w-7 h-7" />}
                    {unreadCount > 0 && (
                        <div className="absolute -top-3 -right-3 bg-zinc-900 border-2 border-white text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-xl animate-bounce whitespace-nowrap z-[60]">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            {unreadCount} YENİ MESAJ
                        </div>
                    )}
                </button>
            )}

            {/* Chat Container with Slide Animation */}
            <div className={`fixed bottom-0 right-0 left-0 sm:bottom-6 sm:right-6 sm:left-auto w-full sm:w-[380px] ${isMinimized ? 'h-16' : 'h-[85vh] sm:h-[550px]'} bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col z-50 overflow-hidden transition-all duration-300 ease-out transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}>
                {/* Header */}
                <div className="p-4 bg-red-600 text-white flex items-center justify-between shadow-lg relative z-10">
                    <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${unreadCount > 0 ? 'bg-white text-red-600 animate-pulse' : 'bg-white/20 text-white'}`}>
                            {unreadCount > 0 ? <Bell className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight leading-none uppercase italic">BKS SOHBET</h3>
                            {unreadCount > 0 && <span className="text-[10px] font-bold opacity-90 uppercase tracking-tighter">{unreadCount} YENİ MESAJ</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {view === 'users' && !isSearchMode && (
                            <button
                                onClick={() => setIsSearchMode(true)}
                                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors mr-1"
                                title="Yeni Mesaj"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {!isMinimized && (
                    <>
                        {view === 'users' ? (
                            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 border-t dark:border-zinc-800">
                                <div className="p-4 border-b dark:border-zinc-800 flex items-center gap-2">
                                    {isSearchMode && (
                                        <button
                                            onClick={() => {
                                                setIsSearchMode(false);
                                                setSearchTerm("");
                                                setSearchResults([]);
                                            }}
                                            className="p-1 text-zinc-400 hover:text-red-600 transition-colors"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
                                        <input
                                            type="text"
                                            placeholder={isSearchMode ? "İsim ile kişi ara..." : "Sohbetlerde ara..."}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoFocus={isSearchMode}
                                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-red-600 outline-none transition-all text-zinc-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {isSearchMode ? (
                                        <>
                                            {isSearching ? (
                                                <div className="p-8 text-center">
                                                    <Loader2 className="w-6 h-6 text-red-600 animate-spin mx-auto mb-2" />
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">Aranıyor...</p>
                                                </div>
                                            ) : searchResults.length > 0 ? (
                                                searchResults.map(user => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => handleSelectUser(user)}
                                                        className="w-full p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b dark:border-zinc-800/50 text-left"
                                                    >
                                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700">
                                                            {user.imageUrl ? (
                                                                <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-black text-zinc-400">{user.name.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300 truncate">{user.name}</p>
                                                            <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-tighter italic">{user.role}</span>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : searchTerm.length > 0 ? (
                                                <div className="p-8 text-center opacity-50">
                                                    <p className="text-xs italic">Kullanıcı bulunamadı.</p>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center opacity-30 mt-10">
                                                    <Search className="w-12 h-12 mx-auto mb-4" />
                                                    <p className="text-xs font-black uppercase tracking-widest italic">Yeni bir sohbet başlatmak için isim yazın.</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {filteredUsers.length > 0 ? (
                                                filteredUsers.map(user => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => handleSelectUser(user)}
                                                        className="w-full p-4 flex items-center gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors border-b dark:border-zinc-800/50 text-left relative group/item"
                                                    >
                                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center overflow-hidden border border-zinc-200 dark:border-zinc-700 group-hover/item:border-red-600/50 transition-all relative">
                                                            {user.imageUrl ? (
                                                                <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="font-black text-zinc-400">{user.name.charAt(0)}</span>
                                                            )}
                                                            {user.hasUnread && (
                                                                <span className="absolute top-0 right-0 w-3 h-3 bg-red-600 border-2 border-white dark:border-zinc-900 rounded-full animate-pulse" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className={`text-sm tracking-tight ${user.hasUnread ? 'font-black text-zinc-900 dark:text-white' : 'font-bold text-zinc-700 dark:text-zinc-300'} truncate`}>{user.name}</p>
                                                                {user.hasUnread && (
                                                                    <span className="text-[8px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                                                                        YENİ
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-tighter italic">{user.role}</span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="p-8 text-center flex flex-col items-center justify-center h-full gap-4 mt-10">
                                                    <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center opacity-20">
                                                        <MessageSquare className="w-8 h-8" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest italic">Henüz sohbet yok</p>
                                                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter italic opacity-75">Üstteki + butonuna basarak yeni bir mesaj gönderin!</p>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-900 relative">
                                {/* Chat Header */}
                                <div className="p-3 border-b dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => setView('users')} className="p-1 text-zinc-400 hover:text-red-600 transition-colors">
                                            <ArrowLeft className="w-5 h-5" />
                                        </button>
                                        <div>
                                            <p className="text-xs font-black text-zinc-900 dark:text-white leading-none mb-1">{selectedUser?.name}</p>
                                            <span className="text-[9px] font-bold text-zinc-400 uppercase">{selectedUser?.role}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-zinc-400 hover:text-red-600 transition-colors rounded-lg">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Messages Container */}
                                <div className="flex-1 relative overflow-hidden flex flex-col">
                                    {isLoading && (
                                        <div className="absolute inset-0 z-20 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[2px] flex items-center justify-center">
                                            <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
                                        </div>
                                    )}

                                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('/chat-bg.png')] bg-repeat">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className={`flex items-end gap-2 ${msg.senderId === currentUserId ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                                <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm text-sm ${msg.senderId === currentUserId
                                                    ? 'bg-red-600 text-white rounded-tr-none'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-200 rounded-tl-none border border-zinc-200/50 dark:border-zinc-700/50'
                                                    }`}>
                                                    {msg.content}
                                                    <span className={`text-[9px] block mt-1 opacity-70 ${msg.senderId === currentUserId ? 'text-right' : 'text-left'}`}>
                                                        {format(new Date(msg.createdAt), 'HH:mm')}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {messages.length === 0 && !isLoading && (
                                            <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-sm">
                                                <Sparkles className="w-8 h-8 mb-2" />
                                                Henüz mesaj yok. İlk mesajı siz yazın!
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Input Area */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-zinc-800 flex gap-2 bg-white dark:bg-zinc-900">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Mesajınızı yazın..."
                                        className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-red-600 outline-none transition-all shadow-inner text-zinc-900 dark:text-white"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim() || isSending}
                                        className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl disabled:opacity-50 transition-all shadow-xl shadow-red-600/30 active:scale-95"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </form>

                                {/* Delete Confirmation Overlay */}
                                {showDeleteConfirm && (
                                    <div className="absolute inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-[280px] shadow-2xl border-2 border-red-600/20 text-center animate-in zoom-in-95 duration-200">
                                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                <AlertTriangle className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-black text-zinc-900 dark:text-white uppercase italic leading-tight mb-2">Sohbeti Sil?</h4>
                                            <p className="text-[10px] text-zinc-500 font-bold mb-6 italic uppercase tracking-tighter">
                                                Tüm mesaj geçmişi kalıcı olarak silinecektir.
                                            </p>
                                            <div className="flex flex-col gap-2">
                                                <button
                                                    onClick={confirmDeleteChat}
                                                    className="w-full py-2.5 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
                                                >
                                                    SİL
                                                </button>
                                                <button
                                                    onClick={() => setShowDeleteConfirm(false)}
                                                    className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    VAZGEÇ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </>
    );
}
