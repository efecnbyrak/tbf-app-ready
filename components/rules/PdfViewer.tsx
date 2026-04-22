"use client";

import { useEffect, useState, useRef } from "react";
import { FileText, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface PdfViewerProps {
    type: "kural" | "yorum";
    height?: string;
}

export function PdfViewer({ type, height = "870px" }: PdfViewerProps) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const urlRef = useRef<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(false);
        setBlobUrl(null);

        fetch(`/api/rules/pdf-view?type=${type}`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.blob();
            })
            .then(blob => {
                if (cancelled) return;
                const url = URL.createObjectURL(blob);
                urlRef.current = url;
                setBlobUrl(url);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
            if (urlRef.current) {
                URL.revokeObjectURL(urlRef.current);
                urlRef.current = null;
            }
        };
    }, [type]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-zinc-400" style={{ height }}>
                <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                <p className="text-sm font-semibold">PDF yükleniyor...</p>
            </div>
        );
    }

    if (error || !blobUrl) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 text-zinc-400" style={{ height }}>
                <AlertCircle className="w-10 h-10 text-zinc-300" />
                <p className="text-sm font-semibold text-zinc-500">PDF yüklenemedi.</p>
                <a
                    href={`/api/rules/pdf-view?type=${type}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors shadow"
                >
                    <ExternalLink className="w-4 h-4" />
                    Yeni Pencerede Aç
                </a>
            </div>
        );
    }

    return (
        <object
            data={blobUrl}
            type="application/pdf"
            className="w-full border-none"
            style={{ height }}
            aria-label="PDF Görüntüleyici"
        >
            {/* Fallback for browsers that don't support object+pdf */}
            <div className="flex flex-col items-center justify-center gap-4 text-zinc-400" style={{ height }}>
                <FileText className="w-10 h-10 text-zinc-300" />
                <p className="text-sm font-semibold text-zinc-500">Tarayıcınız PDF önizlemeyi desteklemiyor.</p>
                <a
                    href={blobUrl}
                    download
                    className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-colors"
                >
                    <FileText className="w-4 h-4" />
                    PDF İndir
                </a>
            </div>
        </object>
    );
}
