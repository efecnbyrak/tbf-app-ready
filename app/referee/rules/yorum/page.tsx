
import { db } from "@/lib/db";
import { FileText, ExternalLink } from "lucide-react";
import Link from "next/link";

// Enable ISR (1 hour)
export const revalidate = 3600;

interface RuleBook {
    id: number;
    title: string;
    description: string | null;
    url: string;
    category: string | null;
    createdAt: Date;
}

export default async function YorumPage({
    searchParams
}: {
    searchParams: { id?: string }
}) {
    const rules = await db.ruleBook.findMany({
        where: {
            category: "Yorumlar"
        },
        orderBy: { createdAt: 'desc' }
    }) as unknown as RuleBook[];

    if (rules.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <FileText className="w-12 h-12 text-zinc-400 mb-4" />
                <h2 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">İçerik Hazırlanıyor</h2>
                <p className="text-zinc-500 max-w-md">
                    Yorumlar ve dökümanlar yönetici tarafından sisteme eklenecektir.
                </p>
            </div>
        );
    }

    const selectedRuleId = searchParams.id ? parseInt(searchParams.id) : rules[0].id;
    const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

    return (
        <div className="space-y-6">
            {/* Rule Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rules.map((rule) => {
                    const isSelected = selectedRule.id === rule.id;
                    return (
                        <Link
                            key={rule.id}
                            href={`/referee/rules/yorum?id=${rule.id}`}
                            scroll={false}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${isSelected
                                ? "border-blue-600 bg-blue-50 dark:bg-blue-900/10"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <FileText className={`w-5 h-5 mt-0.5 ${isSelected ? "text-blue-600" : "text-zinc-400"}`} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 mb-1 line-clamp-2">
                                        {rule.title}
                                    </h3>
                                    {rule.description && (
                                        <p className="text-xs text-zinc-500 line-clamp-2">{rule.description}</p>
                                    )}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Selected Rule Display */}
            {selectedRule && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
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

                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm h-[800px]">
                        <object
                            data={selectedRule.url}
                            type="application/pdf"
                            className="w-full h-full"
                        >
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                <p>PDF görüntülenemiyor.</p>
                                <a
                                    href={selectedRule.url}
                                    target="_blank"
                                    className="mt-2 text-blue-600 hover:underline"
                                >
                                    Dosyayı İndir / Görüntüle
                                </a>
                            </div>
                        </object>
                    </div>
                </div>
            )}
        </div>
    );
}
