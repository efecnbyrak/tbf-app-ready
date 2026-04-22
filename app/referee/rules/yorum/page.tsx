import { db } from "@/lib/db";
import { FileText, FolderOpen } from "lucide-react";
import Link from "next/link";
import { NativeRulesViewer } from "@/components/rules/NativeRulesViewer";

export const dynamic = 'force-dynamic';

export default async function YorumPage({
    searchParams
}: {
    searchParams: { id?: string }
}) {
    const rules = await db.ruleBook.findMany({
        where: { category: "Yorumlar" },
        orderBy: { createdAt: 'desc' }
    });

    const selectedRuleId = searchParams.id ? parseInt(searchParams.id) : rules[0]?.id;
    const selectedRule = rules.find(r => r.id === selectedRuleId) || rules[0];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Native Yorumlar Viewer ── */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Resmi Yorumlar</h2>
                            <p className="text-xs text-zinc-500 font-medium">Basketbol Oyun Kuralları Resmi Yorumlar • Arama yapın veya listede gezinin</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <NativeRulesViewer type="yorum" />
                </div>
            </div>

            {/* ── DB-uploaded yorumlar (if any) ── */}
            {rules.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Yüklenen Diğer Dökümanlar</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rules.map((rule) => {
                            const isSelected = selectedRule?.id === rule.id;
                            return (
                                <Link
                                    key={rule.id}
                                    href={`/referee/rules/yorum?id=${rule.id}`}
                                    scroll={false}
                                    className={`group p-4 rounded-2xl border-2 text-left transition-all ${
                                        isSelected
                                            ? "border-blue-600 bg-blue-50/50 dark:bg-blue-900/10"
                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <FileText className={`w-5 h-5 mt-0.5 shrink-0 ${isSelected ? "text-blue-600" : "text-zinc-400"}`} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-2">
                                                {rule.title}
                                            </h3>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
