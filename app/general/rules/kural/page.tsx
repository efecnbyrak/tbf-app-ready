import { Book } from "lucide-react";
import { NativeRulesViewer } from "@/components/rules/NativeRulesViewer";

export const revalidate = 3600;

export default function KuralPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md">
                            <Book className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Basketbol Oyun Kuralları 2022</h2>
                            <p className="text-xs text-zinc-500 font-medium">Tüm maddeler • Arama yapın veya listede gezinin</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <NativeRulesViewer type="kural" />
                </div>
            </div>
        </div>
    );
}
