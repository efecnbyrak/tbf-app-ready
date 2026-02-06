"use client";

import { AlertCircle, FileText, Download } from "lucide-react";

export default function RulesPage() {
    const pdfUrl = "/documents/oyun-kuralları-2022.pdf";

    return (
        <div className="h-[calc(100vh-12rem)] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-red-600" />
                    BASKETBOL OYUN KURALLARI 2022
                </h2>
                <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm font-medium"
                >
                    <Download className="w-4 h-4" />
                    Yeni Pencerede Aç
                </a>
            </div>

            <div className="flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="Basketbol Oyun Kuralları"
                />
            </div>
        </div>
    );
}
