"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Loader2, BookOpen, Hash, Sparkles, ChevronDown, ChevronUp, Download, FileText } from "lucide-react";

interface SearchResult {
    text: string;
    section: string;
    chunkIndex: number;
    score: number;
    page?: number;
}

interface GroupedResult {
    section: string;
    page?: number;
    texts: string[];
    score: number;
}

interface PdfSearchBoxProps {
    type: "kural" | "yorum";
}

const QUICK_CHIPS: Record<string, string[]> = {
    kural: ["Faul", "Serbest Atış", "Zaman Aşımı", "Top Dışı", "Sayı", "Kural 4", "Kural 12", "Teknik"],
    yorum: ["Pozisyon", "Temas", "Yorumlama", "Hareketler", "İhlal", "Kural Uygulama"],
};

function groupResults(results: SearchResult[]): GroupedResult[] {
    const map = new Map<string, GroupedResult>();
    for (const r of results) {
        const key = `${r.section}||${r.page ?? ""}`;
        if (map.has(key)) {
            const existing = map.get(key)!;
            if (!existing.texts.includes(r.text)) {
                existing.texts.push(r.text);
            }
            if (r.score < existing.score) existing.score = r.score;
        } else {
            map.set(key, {
                section: r.section,
                page: r.page,
                texts: [r.text],
                score: r.score,
            });
        }
    }
    return Array.from(map.values());
}

function highlightText(text: string, query: string): React.ReactNode {
    if (!query || query.trim().length < 2) return text;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === query.trim().toLowerCase()
                    ? <mark key={i} className="bg-amber-200 dark:bg-amber-700/60 text-zinc-900 dark:text-zinc-100 rounded px-0.5 not-italic">{part}</mark>
                    : part
            )}
        </>
    );
}

// Modal - PDF viewer (desktop) veya metin (mobil)
function ResultModal({
    result,
    query,
    type,
    onClose,
}: {
    result: GroupedResult;
    query: string;
    type: "kural" | "yorum";
    onClose: () => void;
}) {
    const pdfDownloadUrl = `/api/rules/pdf-view?type=${type}`;
    const pdfViewUrl = result.page
        ? `/api/rules/pdf-view?type=${type}#page=${result.page}`
        : `/api/rules/pdf-view?type=${type}`;

    // ESC ile kapat
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85vh]">
                {/* Header */}
                <div className="flex items-start gap-3 p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
                    <div className="flex-1 min-w-0">
                        {result.page && (
                            <span className="inline-block text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-lg px-2 py-0.5 mb-1.5">
                                Sayfa {result.page}
                            </span>
                        )}
                        {result.section && (
                            <p className="text-sm font-black text-zinc-800 dark:text-zinc-100 leading-tight">
                                {result.section}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {result.texts.map((text, i) => (
                        <p key={i} className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {highlightText(text, query)}
                        </p>
                    ))}
                </div>

                {/* Footer - PDF buttons */}
                <div className="shrink-0 border-t border-zinc-100 dark:border-zinc-800 p-4 flex flex-col sm:flex-row gap-2">
                    {/* Desktop: iframe'de aç */}
                    <a
                        href={pdfViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hidden sm:flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                        <FileText className="w-4 h-4" />
                        PDF&apos;te Görüntüle{result.page ? ` (Sayfa ${result.page})` : ""}
                    </a>
                    {/* Mobil: indirme linki */}
                    <a
                        href={pdfDownloadUrl}
                        download
                        className="flex sm:hidden flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        PDF&apos;i İndir
                    </a>
                    <button
                        onClick={onClose}
                        className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                        Kapat
                    </button>
                </div>
            </div>
        </div>
    );
}

export function PdfSearchBox({ type }: PdfSearchBoxProps) {
    const [query, setQuery] = useState("");
    const [rawResults, setRawResults] = useState<SearchResult[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [selectedResult, setSelectedResult] = useState<GroupedResult | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const grouped = groupResults(rawResults);

    const doSearch = useCallback(async (q: string) => {
        if (!q || q.trim().length < 2) {
            setRawResults([]);
            setSuggestions([]);
            setIsLoading(false);
            setHasSearched(false);
            return;
        }

        abortRef.current?.abort();
        abortRef.current = new AbortController();
        setIsLoading(true);

        try {
            const res = await fetch(
                `/api/rules/pdf-search?q=${encodeURIComponent(q.trim())}&type=${type}`,
                { signal: abortRef.current.signal }
            );
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            setRawResults(data.results || []);
            setSuggestions(data.suggestions || []);
            setHasSearched(true);
            setExpandedIndex(null);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setRawResults([]);
                setHasSearched(true);
            }
        } finally {
            setIsLoading(false);
        }
    }, [type]);

    useEffect(() => {
        clearTimeout(debounceRef.current);
        if (query.trim().length >= 2) {
            debounceRef.current = setTimeout(() => doSearch(query), 350);
        } else {
            setRawResults([]);
            setSuggestions([]);
            setHasSearched(false);
        }
        return () => clearTimeout(debounceRef.current);
    }, [query, doSearch]);

    const clearSearch = () => {
        setQuery("");
        setRawResults([]);
        setSuggestions([]);
        setHasSearched(false);
        setExpandedIndex(null);
        inputRef.current?.focus();
    };

    const applyQuery = (q: string) => {
        setQuery(q);
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    return (
        <>
            {selectedResult && (
                <ResultModal
                    result={selectedResult}
                    query={query}
                    type={type}
                    onClose={() => setSelectedResult(null)}
                />
            )}

            <div className="space-y-5">
                {/* Search Input */}
                <div className="relative">
                    <div className={`flex items-center gap-3 bg-white dark:bg-zinc-900 border-2 rounded-2xl transition-all duration-200 shadow-lg ${
                        query
                            ? "border-red-500 shadow-red-500/10 dark:shadow-red-500/5"
                            : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 focus-within:border-red-500 focus-within:shadow-red-500/10"
                    }`}>
                        <div className="pl-4 shrink-0">
                            {isLoading
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
                                    ? "Kural no, madde veya kelime arayın... (örn: 'faul', 'kural 12', 'serbest atış')"
                                    : "Yorum, pozisyon veya madde arayın... (örn: 'temas', 'kural yorumu')"
                            }
                            className="flex-1 bg-transparent py-4 text-base text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none font-medium min-w-0"
                        />
                        {query && (
                            <button
                                onClick={clearSearch}
                                className="pr-4 shrink-0 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                aria-label="Aramayı temizle"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    {/* Autocomplete Dropdown */}
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
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                                >
                                    <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{s}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick suggestion chips */}
                {!query && (
                    <div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2.5">Hızlı Arama</p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_CHIPS[type].map(chip => (
                                <button
                                    key={chip}
                                    onClick={() => applyQuery(chip)}
                                    className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Results header */}
                {hasSearched && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                            {grouped.length > 0
                                ? <><span className="text-red-600 dark:text-red-500">{grouped.length}</span> bölüm bulundu</>
                                : `"${query}" için sonuç bulunamadı`
                            }
                        </p>
                        <button onClick={clearSearch} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 font-medium underline-offset-2 hover:underline">
                            Temizle
                        </button>
                    </div>
                )}

                {/* Search Results - Grouped */}
                {grouped.length > 0 && (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-zinc-900">
                        {grouped.map((group, i) => {
                            const isExpanded = expandedIndex === i;
                            const previewText = group.texts[0];

                            return (
                                <div key={i} className="group">
                                    <button
                                        onClick={() => setSelectedResult(group)}
                                        className="flex items-start gap-4 p-4 w-full text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors"
                                    >
                                        {/* Page badge */}
                                        <div className="shrink-0 mt-0.5">
                                            {group.page ? (
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-black border border-red-100 dark:border-red-800/40">
                                                    s.{group.page}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                                    <Hash className="w-4 h-4" />
                                                </span>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {group.section && (
                                                <p className="text-[11px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider mb-1 line-clamp-1">
                                                    {group.section.slice(0, 90)}
                                                </p>
                                            )}
                                            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-2">
                                                {highlightText(previewText, query)}
                                            </p>
                                            {group.texts.length > 1 && (
                                                <p className="text-xs text-zinc-400 mt-1 font-medium">
                                                    +{group.texts.length - 1} ilgili paragraf daha
                                                </p>
                                            )}
                                        </div>

                                        {/* Arrow */}
                                        <div className="shrink-0 mt-1 text-zinc-300 dark:text-zinc-600 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty state */}
                {hasSearched && !isLoading && grouped.length === 0 && (
                    <div className="text-center py-16 text-zinc-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-zinc-500 dark:text-zinc-400">
                            &ldquo;{query}&rdquo; için sonuç bulunamadı
                        </p>
                        <p className="text-sm mt-1.5">Farklı bir kelime veya kural numarası deneyin</p>
                    </div>
                )}
            </div>
        </>
    );
}
