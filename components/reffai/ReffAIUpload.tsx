"use client";

import { useState } from "react";
import { UploadCloud, Loader2, FileCheck, AlertCircle } from "lucide-react";

export function ReffAIUpload() {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [responseMsg, setResponseMsg] = useState<{ type: "success" | "error", text: string } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResponseMsg(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setResponseMsg(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/reffai/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                setResponseMsg({ type: "error", text: data.error || "Yükleme sırasında hata oluştu." });
            } else {
                setResponseMsg({ type: "success", text: data.message || "Doküman başarıyla yapay zeka hafızasına eklendi." });
                setFile(null); // Clear file explicitly
            }
        } catch (err) {
            setResponseMsg({ type: "error", text: "Sunucu bağlantısı kurulamadı. Lütfen network ayarlarınızı kontrol edin." });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <UploadCloud className="w-5 h-5 text-indigo-600" />
                        Doküman Yükle (RAG)
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Sadece Yönetici yetkilileri tarafından AI hafızasına bilgi aktarımı sağlar. PDF olarak kural kitapçıkları yükleyebilirsiniz.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <label className="flex items-center justify-center w-full md:w-auto px-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-indigo-500 rounded-2xl cursor-pointer transition-all">
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                            {file ? <FileCheck className="w-4 h-4 text-emerald-500" /> : <UploadCloud className="w-4 h-4 text-indigo-500" />}
                            <span className="truncate max-w-[200px]">{file ? file.name : "PDF Seç / Sürükle"}</span>
                        </div>
                        <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                    </label>

                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                    >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yükle & Entegre Et"}
                    </button>
                </div>
            </div>

            {responseMsg && (
                <div className={`mt-4 p-3 rounded-xl flex items-center gap-3 text-sm font-medium ${responseMsg.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                        : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
                    }`}>
                    {responseMsg.type === "success" ? <FileCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {responseMsg.text}
                </div>
            )}
        </div>
    );
}
