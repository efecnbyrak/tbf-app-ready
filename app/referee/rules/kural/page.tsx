"use client";

import { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Loader2 } from "lucide-react";

interface RuleBook {
    id: number;
    title: string;
    description: string | null;
    url: string;
    category: string | null;
    createdAt: string;
}

export default function KuralPage() {
    const [rules, setRules] = useState<RuleBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedRule, setSelectedRule] = useState<RuleBook | null>(null);

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch("/api/rules");
            if (res.ok) {
                const data = await res.json();
                // Filter for "Oyun Kuralları" category or show all if no category filter
                const filtered = data.filter((r: RuleBook) =>
                    !r.category || r.category === "Oyun Kuralları" || r.category === ""
                );
                setRules(filtered);
                // Auto-select first rule
                if (filtered.length > 0) {
                    setSelectedRule(filtered[0]);
                }
            }
        } catch (error) {
            console.error("Error fetching rules:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    if (rules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <FileText className="w-12 h-12 text-zinc-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Henüz Kural Kitabı Eklenmemiş</h2>
                <p className="text-zinc-500 max-w-md">
                    Yönetici henüz oyun kuralları eklememiş. Lütfen yöneticinizle iletişime geçin.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Rule Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rules.map((rule) => (
                    <button
                        key={rule.id}
                        onClick={() => setSelectedRule(rule)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${selectedRule?.id === rule.id
                            ? "border-red-600 bg-red-50 dark:bg-red-900/10"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <FileText className={`w-5 h-5 mt-0.5 ${selectedRule?.id === rule.id ? "text-red-600" : "text-zinc-400"}`} />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-2">
                                    {rule.title}
                                </h3>
                                {rule.description && (
                                    <p className="text-xs text-zinc-500 line-clamp-2">{rule.description}</p>
                                )}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Selected Rule Display */}
            {selectedRule && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-red-600" />
                            {selectedRule.title}
                        </h2>
                        <a
                            href={selectedRule.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Yeni Pencerede Aç
                        </a>
                    </div>

                    {selectedRule.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg">
                            {selectedRule.description}
                        </p>
                    )}

                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm h-[800px] relative">
                        {/* Try iframe first for better compatibility */}
                        <iframe
                            src={selectedRule.url}
                            className="w-full h-full"
                            title={selectedRule.title}
                            onError={() => {
                                // If iframe fails, the fallback message will show
                                console.error("PDF loading error");
                            }}
                        >
                            {/* Fallback for browsers that don't support iframe for PDFs */}
                            <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                                <FileText className="w-16 h-16 text-zinc-400 mx-auto" />
                                <div>
                                    <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                                        PDF Görüntülenemiyor
                                    </p>
                                    <p className="text-sm text-zinc-500 mb-4">
                                        Tarayıcınız PDF görüntülemeyi desteklemiyor veya dosya erişilemiyor.
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 w-full max-w-xs">
                                    <a
                                        href={selectedRule.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                        Yeni Sekmede Aç
                                    </a>
                                    <a
                                        href={selectedRule.url}
                                        download
                                        className="w-full px-6 py-3 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download className="w-5 h-5" />
                                        İndir
                                    </a>
                                </div>
                            </div>
                        </iframe>
                    </div>
                </div>
            )}
        </div>
    );
}
