
import { db } from "@/lib/db";
import { FileText, ExternalLink, Book, ChevronRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

// Enable ISR (1 hour)
export const revalidate = 3600;

interface RuleBook {
    id: number;
    title: string;
    description: string | null;
    content: string | null;
    url: string | null;
    category: string | null;
    createdAt: Date;
}

interface DigitalSection {
    section?: string;
    h1?: string;
    p?: string;
}

export default async function KuralPage({
    searchParams
}: {
    searchParams: { id?: string }
}) {
    const rules = await db.ruleBook.findMany({
        where: {
            OR: [
                { category: "Oyun Kuralları" },
                { category: "" },
                { category: null }
            ]
        },
        orderBy: { createdAt: 'desc' }
    });

    if (rules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl">
                <FileText className="w-12 h-12 text-zinc-300 mb-4" />
                <h2 className="text-xl font-bold mb-2">Henüz Kural Kitabı Eklenmemiş</h2>
                <p className="text-zinc-500 max-w-md">
                    Yönetici henüz oyun kuralları eklememiş.
                </p>
            </div>
        );
    }

    const selectedRuleId = searchParams.id ? parseInt(searchParams.id) : rules[0].id;
    const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

    const parseDigitalContent = (content: string | null): DigitalSection[] => {
        if (!content) return [];
        try {
            return JSON.parse(content);
        } catch (e) {
            return [{ p: content }];
        }
    };

    const digitalContent = selectedRule.url ? null : parseDigitalContent(selectedRule.content);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Rule Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rules.map((rule) => {
                    const isSelected = selectedRule.id === rule.id;
                    return (
                        <Link
                            key={rule.id}
                            href={`/referee/rules/kural?id=${rule.id}`}
                            scroll={false}
                            className={`group p-5 rounded-2xl border-2 text-left transition-all relative overflow-hidden ${isSelected
                                ? "border-red-600 bg-red-50/50 dark:bg-red-900/10 shadow-lg shadow-red-100 dark:shadow-none"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl ${isSelected ? "bg-red-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 group-hover:text-zinc-600"} transition-colors`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${rule.url ? "bg-zinc-200 text-zinc-600" : "bg-blue-600 text-white"}`}>
                                            {rule.url ? "PDF" : "DİJİTAL"}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug">
                                        {rule.title}
                                    </h3>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Content Display Area */}
            {selectedRule && (
                <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
                    {/* Toolbar */}
                    <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 shadow-lg">
                                <Book className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                                    {selectedRule.title}
                                </h2>
                                {selectedRule.category && (
                                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                        {selectedRule.category}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedRule.url && (
                                <a
                                    href={selectedRule.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl hover:opacity-90 transition-all text-sm font-black shadow-lg active:scale-95"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    PDF YENİ PENCEREDE AÇ
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Responsive Reader */}
                    <div className="min-h-[600px] bg-zinc-50 dark:bg-zinc-950/50 p-4 md:p-8">
                        {digitalContent ? (
                            /* ── Digital Content (JSON Parsed) ── */
                            <div className="max-w-4xl mx-auto space-y-12 pb-20">
                                {digitalContent.map((item, idx) => (
                                    <div key={idx} className="group animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                        {item.section && (
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                                <span className="text-xs font-black text-red-600 dark:text-red-500 uppercase tracking-[0.3em] bg-white dark:bg-zinc-950 px-4 py-1 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                                    {item.section}
                                                </span>
                                                <div className="h-[2px] flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                            </div>
                                        )}
                                        {item.h1 && (
                                            <h3 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-6 leading-tight tracking-tighter">
                                                {item.h1}
                                            </h3>
                                        )}
                                        {item.p && (
                                            <div className="relative pl-8 border-l-4 border-zinc-100 dark:border-zinc-800 group-hover:border-red-600 transition-colors">
                                                <p className="text-lg text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                                                    {item.p}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {digitalContent.length === 0 && (
                                    <div className="text-center py-20 text-zinc-400 font-medium">
                                        Bu dökümanın içeriği boş veya hatalı formatlanmış.
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* ── PDF Content (Iframe) ── */
                            <div className="w-full h-[800px] rounded-2xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-inner relative">
                                <iframe
                                    src={selectedRule.url!}
                                    className="w-full h-full border-none"
                                    title={selectedRule.title}
                                >
                                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                                        <FileText className="w-16 h-16 text-zinc-300 mb-4" />
                                        <p className="text-zinc-500 font-bold mb-4">Tarayıcınız PDF önizlemeyi desteklemiyor.</p>
                                        <a
                                            href={selectedRule.url!}
                                            download
                                            className="px-6 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg"
                                        >
                                            DOSYAYI İNDİR
                                        </a>
                                    </div>
                                </iframe>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
