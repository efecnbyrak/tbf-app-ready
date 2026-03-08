"use client";

import { useState } from "react";
import { submitObserverReport } from "@/app/actions/reports";
import { ClipboardList, Send, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewReportPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const [preview, setPreview] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus(null);

        try {
            const formData = new FormData(e.currentTarget);

            // If there's a preview (base64), use it as imageUrl
            if (preview) {
                formData.set("imageUrl", preview);
            }

            const result = await submitObserverReport(formData);

            if (result.success) {
                setStatus({ type: 'success', message: 'Raporunuz başarıyla gönderildi.' });
                (e.target as HTMLFormElement).reset();
                setPreview(null);
            } else {
                setStatus({ type: 'error', message: result.error || 'Bir hata oluştu.' });
            }
        } catch (err) {
            setStatus({ type: 'error', message: 'İşlem sırasında bir hata oluştu.' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                alert("Dosya boyutu 10MB'dan küçük olmalıdır.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">GÖZLEMCİ RAPOR SİSTEMİ</h1>
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest italic">
                        Saha eksikliklerini ve olayları raporlayın
                    </p>
                </div>
                <div className="ml-auto">
                    <Link
                        href="/admin/observer-reports"
                        className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-5 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 uppercase italic border border-zinc-200 dark:border-zinc-700"
                    >
                        <ClipboardList className="w-4 h-4" /> ÖNCEKİ RAPORLARIM
                    </Link>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-6">
                {status && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {status.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        <span className="font-semibold">{status.message}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">KONU BAŞLIĞI</label>
                    <input
                        required
                        name="title"
                        type="text"
                        placeholder="Örn: 24 Saniye Cihazı Arızası veya Hakem Olayı"
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">KONU İÇERİĞİ</label>
                    <textarea
                        required
                        name="content"
                        rows={6}
                        placeholder="Raporlamak istediğiniz durumu detaylıca açıklayınız..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-red-600 outline-none transition-all resize-none"
                    />
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                        RESİM EKLE <span className="text-[10px] font-normal lowercase">(isteğe bağlı)</span>
                    </label>

                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4 items-center">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="report-image"
                            />
                            <label
                                htmlFor="report-image"
                                className="flex-1 cursor-pointer bg-zinc-50 dark:bg-zinc-950 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-8 flex flex-col items-center justify-center gap-3 hover:border-red-600/50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all group"
                            >
                                <div className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-6 h-6 text-zinc-400 group-hover:text-red-600" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400">Resim Seçmek İçin Tıklayın</p>
                                    <p className="text-[10px] text-zinc-400 font-medium">PNG, JPG veya WEBP (Max 10MB)</p>
                                </div>
                            </label>

                            {preview && (
                                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg">
                                    <img src={preview} alt="Önizleme" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setPreview(null)}
                                        className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-700"
                                    >
                                        <Loader2 className="w-3 h-3 rotate-45" /> {/* Close icon substitution */}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                        {isSubmitting ? 'GÖNDERİLİYOR...' : 'RAPORU GÖNDER'}
                    </button>
                </div>
            </form>
        </div>
    );
}
