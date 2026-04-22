import { ExternalLink, FolderOpen, Search } from "lucide-react";
import { PdfSearchBox } from "@/components/rules/PdfSearchBox";
import { PdfViewer } from "@/components/rules/PdfViewer";

export const revalidate = 3600;

export default function YorumPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* ── Advanced Search Section ── */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
                <div className="px-6 pt-6 pb-5 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">Yorum Arama</h2>
                            <p className="text-xs text-zinc-500 font-medium">Basketbol Oyun Kuralları Resmi Yorumları içinde ara</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <PdfSearchBox type="yorum" />
                </div>
            </div>

            {/* ── PDF Viewer ── */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl">
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="font-black text-zinc-900 dark:text-white">Basketbol Oyun Kuralları Resmi Yorumlar</h2>
                            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">PDF Görüntüleyici</span>
                        </div>
                    </div>
                    <a
                        href="/api/rules/pdf-view?type=yorum"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-black hover:opacity-90 transition-all active:scale-95 shadow"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Yeni Pencerede Aç
                    </a>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-2">
                    <PdfViewer type="yorum" />
                </div>
            </div>
        </div>
    );
}
