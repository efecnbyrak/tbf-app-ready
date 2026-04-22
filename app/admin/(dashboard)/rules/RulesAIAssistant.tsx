"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Bot, Loader2, ChevronDown, X, Sparkles } from "lucide-react";
import Fuse from "fuse.js";

interface ParsedRule {
    id: string;
    title: string;
    content: string;
    keywords: string[];
}

function extractKeywords(text: string): string[] {
    const stopWords = new Set([
        "ve", "veya", "ile", "bir", "bu", "da", "de", "ki", "için", "olan",
        "olan", "gibi", "her", "daha", "çok", "az", "en", "ne", "o", "bu",
        "şu", "ise", "değil", "ancak", "fakat", "ama", "eğer", "ise",
        "the", "a", "an", "is", "in", "on", "at", "to", "of", "and", "or"
    ]);
    const words = text
        .toLowerCase()
        .replace(/[^a-zçğıöşü0-9\s]/gi, " ")
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));
    // Deduplicate and take top 20
    return [...new Set(words)].slice(0, 20);
}

function highlightText(text: string, query: string): string {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`(${escaped})`, "gi"), "<mark class=\"bg-yellow-200 dark:bg-yellow-800 rounded px-0.5\">$1</mark>");
}

export default function RulesAIAssistant() {
    const [rules, setRules] = useState<ParsedRule[]>([]);
    const [fuse, setFuse] = useState<Fuse<ParsedRule> | null>(null);
    const [isLoadingRules, setIsLoadingRules] = useState(true);

    // Search state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<ParsedRule[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedRule, setSelectedRule] = useState<ParsedRule | null>(null);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // AI state
    const [question, setQuestion] = useState("");
    const [aiAnswer, setAiAnswer] = useState("");
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");

    // Load rules from API
    useEffect(() => {
        async function loadRules() {
            try {
                const res = await fetch("/api/ai/rules");
                if (!res.ok) throw new Error("Failed to load rules");
                const data: ParsedRule[] = await res.json();
                setRules(data);

                const fuseInstance = new Fuse(data, {
                    keys: [
                        { name: "title", weight: 0.5 },
                        { name: "keywords", weight: 0.3 },
                        { name: "content", weight: 0.2 },
                    ],
                    threshold: 0.4,
                    includeScore: true,
                    minMatchCharLength: 2,
                });
                setFuse(fuseInstance);
            } catch (err) {
                console.error("Failed to load rules for AI assistant:", err);
            } finally {
                setIsLoadingRules(false);
            }
        }
        loadRules();
    }, []);

    // Debounced search
    useEffect(() => {
        if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

        if (!searchQuery.trim() || !fuse) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        searchDebounceRef.current = setTimeout(() => {
            const results = fuse.search(searchQuery, { limit: 6 });
            setSearchResults(results.map(r => r.item));
            setShowDropdown(results.length > 0);
        }, 300);

        return () => {
            if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
        };
    }, [searchQuery, fuse]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleSelectRule = (rule: ParsedRule) => {
        setSelectedRule(rule);
        setSearchQuery(rule.title);
        setShowDropdown(false);
    };

    const handleAskAI = async () => {
        if (!question.trim()) return;
        if (!fuse || rules.length === 0) {
            setAiError("Kurallar yüklenemedi. Lütfen sayfayı yenileyin.");
            return;
        }

        setIsAiLoading(true);
        setAiAnswer("");
        setAiError("");

        // Find top 5 relevant rules using Fuse
        const results = fuse.search(question, { limit: 5 });
        const topRules = results.map(r => r.item);

        if (topRules.length === 0) {
            setAiError("Bu soruyla ilgili kural bulunamadı. Lütfen daha spesifik bir soru sorun.");
            setIsAiLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/ai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question, topRules }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "AI yanıt vermedi.");
            }

            const data = await res.json();
            setAiAnswer(data.answer);
        } catch (err: any) {
            setAiError(err.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAskAI();
    };

    return (
        <div className="mt-10 space-y-6">
            {/* Section Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        Kural Arama & Akıllı Yardım
                    </h2>
                    <p className="text-xs text-zinc-500 mt-0.5">
                        Kurallarda arama yapın veya AI'ya soru sorun — sadece kural dosyalarına göre cevaplar
                    </p>
                </div>
                {isLoadingRules && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-zinc-400">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Kurallar yükleniyor...
                    </div>
                )}
                {!isLoadingRules && (
                    <span className="ml-auto text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                        {rules.length} kural dosyası
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Feature 1: Smart Search */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Search className="w-4 h-4 text-zinc-500" />
                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                            Kural Arama
                        </h3>
                    </div>

                    <div ref={searchRef} className="relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (selectedRule) setSelectedRule(null);
                                }}
                                onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                                placeholder="Kural ara..."
                                className="w-full pl-10 pr-10 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:bg-zinc-950 text-sm transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => { setSearchQuery(""); setSelectedRule(null); setShowDropdown(false); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {/* Autocomplete Dropdown */}
                        {showDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg overflow-hidden">
                                {searchResults.map((rule) => (
                                    <button
                                        key={rule.id}
                                        onClick={() => handleSelectRule(rule)}
                                        className="w-full text-left px-4 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 border-b border-zinc-100 dark:border-zinc-800 last:border-0 transition-colors"
                                    >
                                        <div
                                            className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
                                            dangerouslySetInnerHTML={{ __html: highlightText(rule.title, searchQuery) }}
                                        />
                                        <div className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                                            {rule.keywords.slice(0, 4).join(", ")}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Selected Rule Content */}
                    {selectedRule && (
                        <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 max-h-64 overflow-y-auto">
                            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-2">
                                {selectedRule.title}
                            </h4>
                            <div
                                className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap"
                                dangerouslySetInnerHTML={{
                                    __html: highlightText(
                                        selectedRule.content.slice(0, 800) + (selectedRule.content.length > 800 ? "..." : ""),
                                        searchQuery
                                    )
                                }}
                            />
                            {selectedRule.keywords.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-1">
                                    {selectedRule.keywords.slice(0, 8).map(kw => (
                                        <span key={kw} className="text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
                                            {kw}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!selectedRule && !isLoadingRules && rules.length === 0 && (
                        <div className="mt-4 p-4 text-center text-sm text-zinc-400">
                            <p>Kural dosyası bulunamadı.</p>
                            <p className="text-xs mt-1">
                                <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">/data/rules</code> klasörüne .txt, .md veya .json dosyaları ekleyin.
                            </p>
                        </div>
                    )}
                </div>

                {/* Feature 2: AI Question Answering */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Bot className="w-4 h-4 text-violet-500" />
                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 text-sm">
                            AI Kural Asistanı
                        </h3>
                        <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-medium">
                            Gemini
                        </span>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Sorunu yaz... (Enter ile gönder)"
                            disabled={isAiLoading || isLoadingRules}
                            className="flex-1 px-4 py-3 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none dark:bg-zinc-950 text-sm disabled:opacity-60 transition-all"
                        />
                        <button
                            onClick={handleAskAI}
                            disabled={isAiLoading || !question.trim() || isLoadingRules}
                            className="px-4 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-xl transition-all flex items-center gap-2 font-medium text-sm"
                        >
                            {isAiLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Sparkles className="w-4 h-4" />
                            )}
                        </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 mt-2">
                        Örn: &quot;Takımın baş antrenörü olmadan maça çıkılırsa ne olur?&quot;
                    </p>

                    {/* AI Answer */}
                    {isAiLoading && (
                        <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/30 flex items-center gap-3">
                            <Loader2 className="w-4 h-4 animate-spin text-violet-500 flex-shrink-0" />
                            <span className="text-sm text-violet-600 dark:text-violet-400">
                                İlgili kurallar aranıyor ve AI yanıt hazırlıyor...
                            </span>
                        </div>
                    )}

                    {aiError && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/30">
                            <p className="text-sm text-red-600 dark:text-red-400">{aiError}</p>
                        </div>
                    )}

                    {aiAnswer && !isAiLoading && (
                        <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/10 rounded-xl border border-violet-100 dark:border-violet-800/30 max-h-72 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-3">
                                <Bot className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wide">
                                    AI Yanıtı
                                </span>
                            </div>
                            <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                                {aiAnswer}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
