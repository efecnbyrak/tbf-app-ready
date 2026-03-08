"use client";

import { useState } from "react";
import { Send, Users, ChevronDown, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { sendAnnouncement } from "@/app/actions/announcements";

const TARGETS = [
    { id: "ALL", label: "Tüm Kullanıcılar" },
    { id: "REFEREE", label: "Sadece Hakemler" },
    { id: "TABLE", label: "Sadece Masa Görevlileri" },
    { id: "OBSERVER", label: "Sadece Gözlemciler" },
    { id: "STATISTICIAN", label: "Sadece İstatistikçiler" },
    { id: "HEALTH", label: "Sadece Sağlıkçılar" },
    { id: "FIELD_COMMISSIONER", label: "Sadece Saha Komiserleri" },
];

export default function AnnouncementClient() {
    const [subject, setSubject] = useState("");
    const [content, setContent] = useState("");
    const [target, setTarget] = useState("ALL");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subject || !content) return;

        setLoading(true);
        setStatus(null);

        try {
            const res = await sendAnnouncement(subject, content, target);
            if (res.success) {
                setStatus({ type: 'success', message: res.message });
                setSubject("");
                setContent("");
            } else {
                setStatus({ type: 'error', message: res.message });
            }
        } catch (error) {
            setStatus({ type: 'error', message: "Beklenmedik bir hata oluştu." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Target Selector */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">Alıcı Grubu</label>
                        <div className="relative group">
                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                            <select
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all appearance-none italic"
                            >
                                {TARGETS.map(t => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">E-Posta Konusu</label>
                        <input
                            required
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Örn: Hafta Sonu Maç Görevlendirmeleri Hakkında"
                            className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-2xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all italic placeholder:text-zinc-500 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-widest italic ml-1">Duyuru İçeriği</label>
                    <textarea
                        required
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Mesajınızı buraya yazın..."
                        rows={10}
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-3xl py-4 px-6 text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all italic resize-none placeholder:text-zinc-500 dark:placeholder:text-zinc-600 text-zinc-900 dark:text-white"
                    />
                </div>

                {/* Status Message */}
                {status && (
                    <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${status.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                        }`}>
                        {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                        <p className="text-xs font-bold uppercase italic">{status.message}</p>
                    </div>
                )}

                {/* Submit */}
                <button
                    disabled={loading || !subject || !content}
                    type="submit"
                    className="w-full bg-red-700 hover:bg-black text-white font-black py-5 rounded-2xl shadow-2xl shadow-red-600/40 border-4 border-white/10 hover:border-red-500 flex items-center justify-center gap-4 transition-all disabled:opacity-50 group hover:-translate-y-2 active:scale-95 outline-none tracking-tighter"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            DUYURUYU ŞİMDİ GÖNDER
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
