"use client";

import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

interface ExportButtonProps {
    group?: string;
    type?: string;
}

export function ExportButton({ group, type }: ExportButtonProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleExport = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (group) params.set("group", group);
            if (type) params.set("type", type);

            const response = await fetch(`/admin/all-availabilities/export?${params.toString()}`);
            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const contentDisposition = response.headers.get("Content-Disposition");
            let filename = "Uygunluk_Listesi.xlsx";
            if (contentDisposition) {
                const match = contentDisposition.match(/filename="(.+)"/);
                if (match && match.length > 1) {
                    filename = match[1];
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            alert("Excel dosyası indirilirken bir hata oluştu.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={isLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isLoading
                ? "bg-green-600/70 text-white cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
                }`}
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
            {isLoading ? "Hazırlanıyor..." : "Excel İndir"}
        </button>
    );
}

