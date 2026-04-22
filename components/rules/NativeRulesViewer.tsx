"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, BookOpen, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface RuleSection {
    id: string;
    title: string;
    paragraphs: string[];
}

interface RuleArticle {
    id: string;
    title: string;
    page: number;
    intro: string[];
    sections: RuleSection[];
}

interface SearchEntry {
    madde: string;
    maddeTitle: string;
    sectionId: string;
    sectionTitle: string;
    text: string;
    page: number;
}

interface NativeRulesViewerProps {
    type: "kural" | "yorum";
}

const QUICK_CHIPS: Record<string, string[]> = {
    kural: ["Faul", "Serbest Atış", "8 Saniye", "Dripling", "Teknik Faul", "Kavga", "Sayı", "Zaman Aşımı"],
    yorum: ["Temas", "Pozisyon", "Hareketler", "İhlal", "Faul", "Kural Uygulama"],
};

const TYPE_LABEL: Record<string, string> = {
    kural: "Basketbol Oyun Kuralları 2022",
    yorum: "Resmi Yorumlar",
};

function highlightText(text: string, query: string): React.ReactNode {
    if (!query || query.trim().length < 2) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.trim().toLowerCase()
                    ? <mark key={i} className="bg-amber-200 dark:bg-amber-700/60 text-zinc-900 dark:text-zinc-100 rounded px-0.5 not-italic font-semibold">{part}</mark>
                    : part
            )}
        </>
    );
}

function ArticleCard({
    article,
    query,
    defaultOpen = false,
    matchedSectionIds = [],
}: {
    article: RuleArticle;
    query: string;
    defaultOpen?: boolean;
    matchedSectionIds?: string[];
}) {
    const [open, setOpen] = useState(defaultOpen);

    useEffect(() => {
        setOpen(defaultOpen);
    }, [defaultOpen]);

    return (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
            {/* Article Header */}
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center gap-4 px-4 py-4 sm:px-5 sm:py-5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 active:bg-zinc-100 dark:active:bg-zinc-800 transition-colors"
            >
                {/* Number badge */}
                <span className="shrink-0 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-600 text-white text-base font-black shadow-sm shadow-red-600/30">
                    {article.id}
                </span>

                <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-red-500 dark:text-red-400 uppercase tracking-[0.15em] mb-0.5">
                        Madde {article.id}
                    </p>
                    <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] sm:text-base leading-snug">
                        {query ? highlightText(article.title, query) : article.title}
                    </p>
                </div>

                <span className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    open
                        ? "bg-red-50 dark:bg-red-900/20 text-red-500"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                }`}>
                    {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
            </button>

            {/* Article Content */}
            {open && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 pb-5 pt-4 sm:px-5 space-y-5">
                    {/* Intro paragraphs */}
                    {article.intro.length > 0 && (
                        <div className="space-y-2.5 pb-1">
                            {article.intro.map((p, i) => (
                                <p key={i} className="text-[15px] text-zinc-700 dark:text-zinc-300 leading-[1.75]">
                                    {query ? highlightText(p, query) : p}
                                </p>
                            ))}
                        </div>
                    )}

                    {/* Sections */}
                    <div className="space-y-4">
                        {article.sections.map((sec, si) => {
                            const isMatchedSection = matchedSectionIds.includes(sec.id);
                            return (
                                <div
                                    key={si}
                                    className={`relative pl-4 border-l-[3px] rounded-r-xl pr-3 py-3 space-y-2 ${
                                        isMatchedSection && query
                                            ? "border-amber-400 bg-amber-50 dark:bg-amber-900/10"
                                            : "border-red-200 dark:border-red-900/60 bg-zinc-50 dark:bg-zinc-800/40"
                                    }`}
                                >
                                    {/* Section ID + Title */}
                                    {(sec.title || sec.id) && (
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            {sec.id && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-black tracking-wide shrink-0">
                                                    {sec.id}
                                                </span>
                                            )}
                                            {sec.title && (
                                                <span className="text-[15px] sm:text-base font-bold text-zinc-800 dark:text-zinc-200 leading-snug">
                                                    {query ? highlightText(sec.title, query) : sec.title}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Paragraphs */}
                                    <div className="space-y-2">
                                        {sec.paragraphs.map((para, pi) => (
                                            <p key={pi} className={`text-[14px] sm:text-[15px] leading-[1.75] ${
                                                para.startsWith('•') || para.startsWith('-')
                                                    ? "pl-4 text-zinc-500 dark:text-zinc-400"
                                                    : "text-zinc-700 dark:text-zinc-300"
                                            }`}>
                                                {query ? highlightText(para, query) : para}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function NativeRulesViewer({ type }: NativeRulesViewerProps) {
    const [articles, setArticles] = useState<RuleArticle[]>([]);
    const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searching, setSearching] = useState(false);

    const [searchResults, setSearchResults] = useState<{article: RuleArticle; matchedSectionIds: string[]}[]>([]);
    const [hasSearched, setHasSearched] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const fuseRef = useRef<any>(null);

    useEffect(() => {
        async function load() {
            try {
                const [artRes, searchRes] = await Promise.all([
                    fetch(`/rules-data/${type}-articles.json`),
                    fetch(`/rules-data/${type}-search.json`),
                ]);
                const arts: RuleArticle[] = await artRes.json();
                const idx: SearchEntry[] = await searchRes.json();
                setArticles(arts);
                setSearchIndex(idx);

                const Fuse = (await import('fuse.js')).default;
                fuseRef.current = new Fuse(idx, {
                    keys: [
                        { name: 'maddeTitle', weight: 0.4 },
                        { name: 'sectionTitle', weight: 0.3 },
                        { name: 'text', weight: 0.3 },
                    ],
                    threshold: 0.38,
                    includeScore: true,
                    ignoreLocation: true,
                    findAllMatches: true,
                    minMatchCharLength: 2,
                });
            } catch (e) {
                console.error('Failed to load rules data', e);
            } finally {
                setLoadingData(false);
            }
        }
        load();
    }, [type]);

    const doSearch = useCallback((q: string) => {
        if (!q || q.trim().length < 2 || !fuseRef.current) {
            setSearchResults([]);
            setHasSearched(false);
            setSuggestions([]);
            return;
        }

        setSearching(true);

        const results = fuseRef.current.search(q.trim(), { limit: 20 });

        const maddeMap = new Map<string, Set<string>>();
        for (const r of results) {
            const item: SearchEntry = r.item;
            if (!maddeMap.has(item.madde)) maddeMap.set(item.madde, new Set());
            if (item.sectionId) maddeMap.get(item.madde)!.add(item.sectionId);
        }

        const matched = [];
        for (const [maddeId, sectionIds] of maddeMap) {
            const article = articles.find(a => a.id === maddeId);
            if (article) {
                matched.push({ article, matchedSectionIds: Array.from(sectionIds) });
            }
        }

        setSearchResults(matched);
        setHasSearched(true);
        setSearching(false);

        const q2 = q.toLowerCase();
        const words = new Set<string>();
        for (const entry of searchIndex) {
            const tokens = (entry.maddeTitle + ' ' + entry.text).toLowerCase().split(/\s+/);
            for (const t of tokens) {
                if (t.length >= 4 && t.startsWith(q2) && t !== q2) words.add(t);
                if (words.size >= 6) break;
            }
            if (words.size >= 6) break;
        }
        setSuggestions(Array.from(words).slice(0, 5));
    }, [articles, searchIndex]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (query.trim().length >= 2) {
            debounceRef.current = setTimeout(() => doSearch(query), 300);
        } else {
            setSearchResults([]);
            setHasSearched(false);
            setSuggestions([]);
        }
        return () => clearTimeout(debounceRef.current);
    }, [query, doSearch]);

    const clearSearch = () => {
        setQuery("");
        setSearchResults([]);
        setHasSearched(false);
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const applyQuery = (q: string) => {
        setQuery(q);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <span className="ml-3 text-zinc-500 font-semibold">Kurallar yükleniyor...</span>
            </div>
        );
    }

    const displayArticles = hasSearched ? searchResults : articles.map(a => ({ article: a, matchedSectionIds: [] }));

    return (
        <div className="space-y-5">
            {/* Search Input */}
            <div className="relative">
                <div className={`flex items-center gap-3 bg-white dark:bg-zinc-900 border-2 rounded-2xl transition-all duration-200 shadow-md ${
                    query
                        ? "border-red-500 shadow-red-500/10 dark:shadow-red-500/5"
                        : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus-within:border-red-500 focus-within:shadow-red-500/10"
                }`}>
                    <div className="pl-4 shrink-0">
                        {searching
                            ? <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                            : <Search className="w-5 h-5 text-zinc-400" />
                        }
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onKeyDown={e => { if (e.key === 'Escape') clearSearch(); }}
                        placeholder={
                            type === "kural"
                                ? "Madde, kural veya kelime arayın..."
                                : "Yorum, pozisyon veya madde arayın..."
                        }
                        className="flex-1 bg-transparent py-4 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none font-medium min-w-0"
                    />
                    {query && (
                        <button
                            onClick={clearSearch}
                            className="pr-4 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Autocomplete */}
                {showSuggestions && suggestions.length > 0 && query.length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-20 overflow-hidden">
                        <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Öneriler
                            </span>
                        </div>
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onMouseDown={() => applyQuery(s)}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                <span className="text-zinc-700 dark:text-zinc-300 font-medium">{s}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick chips */}
            {!query && (
                <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] mb-3">Hızlı Arama</p>
                    <div className="flex flex-wrap gap-2">
                        {QUICK_CHIPS[type].map(chip => (
                            <button
                                key={chip}
                                onClick={() => applyQuery(chip)}
                                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results / list header */}
            {hasSearched ? (
                <div className="flex items-center justify-between py-0.5">
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                        {searchResults.length > 0
                            ? <><span className="text-red-600 dark:text-red-500">{searchResults.length}</span> madde bulundu</>
                            : `"${query}" için sonuç bulunamadı`
                        }
                    </p>
                    <button onClick={clearSearch} className="text-xs text-zinc-400 hover:text-zinc-600 font-semibold underline-offset-2 hover:underline transition-colors">
                        Temizle
                    </button>
                </div>
            ) : (
                !query && (
                    <div className="flex items-center justify-between py-0.5">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">
                            {TYPE_LABEL[type]} — {articles.length} Madde
                        </p>
                    </div>
                )
            )}

            {/* Articles list */}
            <div className="space-y-2.5">
                {displayArticles.map(({ article, matchedSectionIds }) => (
                    <ArticleCard
                        key={article.id}
                        article={article}
                        query={query}
                        defaultOpen={hasSearched}
                        matchedSectionIds={matchedSectionIds}
                    />
                ))}
            </div>

            {/* Empty state */}
            {hasSearched && searchResults.length === 0 && (
                <div className="text-center py-16 text-zinc-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-25" />
                    <p className="font-bold text-zinc-500 dark:text-zinc-400 text-base">
                        &ldquo;{query}&rdquo; için sonuç bulunamadı
                    </p>
                    <p className="text-sm mt-2 text-zinc-400">Farklı bir kelime veya madde numarası deneyin</p>
                </div>
            )}
        </div>
    );
}
