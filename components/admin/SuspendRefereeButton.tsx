"use client";

import { useState } from "react";
import { suspendUser } from "@/app/actions/admin-users";
import { ShieldOff, Calendar, Check, X } from "lucide-react";
import { Modal } from "../ui/modal";

interface SuspendRefereeButtonProps {
    userId: number;
    suspendedUntil?: string | null;
}

export function SuspendRefereeButton({ userId, suspendedUntil }: SuspendRefereeButtonProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const isSuspended = suspendedUntil && new Date(suspendedUntil) > new Date();

    const handleSuspend = async () => {
        if (!date && !isSuspended) return;

        const confirmMsg = isSuspended
            ? "Cezayı kaldırmak istediğinize emin misiniz?"
            : `${date} tarihine kadar dondurmak istediğinize emin misiniz?`;

        if (!confirm(confirmMsg)) return;

        setLoading(true);
        try {
            await suspendUser(userId, date ? new Date(date) : null);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIsMenuOpen(false);
            }, 1500);
        } catch (error) {
            console.error(error);
            alert("İşlem başarısız.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsMenuOpen(true)}
                title={isSuspended ? "Cezayı Kaldır / Güncelle" : "Ceza Ver (Dondur)"}
                className={`p-1.5 rounded-lg transition-colors ${isSuspended
                    ? "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-600/20"
                    : "text-zinc-400 hover:text-red-600 hover:bg-red-50"
                    }`}
            >
                <ShieldOff size={16} />
            </button>

            <Modal
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                title={isSuspended ? "Cezayı Yönet" : "Hakemi Dondur"}
            >
                <div className="space-y-6">
                    {showSuccess ? (
                        <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-100 dark:border-green-800 p-8 rounded-2xl text-center animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600 dark:text-green-300" />
                            </div>
                            <h3 className="text-lg font-black text-green-900 dark:text-green-100 uppercase tracking-tight">İşlem Başarılı</h3>
                            <p className="text-sm font-medium text-green-700 dark:text-green-400 mt-1">Veritabanı güncellendi.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSuspended ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-600"}`}>
                                    <ShieldOff size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-zinc-900 dark:text-white">Durum: {isSuspended ? "Donduruldu" : "Aktif"}</h4>
                                    {isSuspended && (
                                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                            BİTİŞ: {new Date(suspendedUntil!).toLocaleDateString("tr-TR")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-zinc-500 flex items-center gap-2 uppercase tracking-widest">
                                    <Calendar size={14} />
                                    {isSuspended ? "Yeni Bitiş Tarihi (Güncellemek İçin):" : "Dondurma Bitiş Tarihi:"}
                                </label>
                                <input
                                    type="date"
                                    value={date}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full text-sm font-bold p-4 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-700 rounded-2xl outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all cursor-pointer"
                                />
                                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed bg-zinc-50 dark:bg-zinc-800/30 p-3 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                                    ⓘ Dondurulan hakemler belirtilen tarihe kadar sisteme giriş yapamaz ve uygunluk formu dolduramazlar.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleSuspend}
                                    disabled={loading || (!date && !isSuspended)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-xs font-black transition-all active:scale-95 disabled:opacity-50 shadow-xl ${isSuspended
                                        ? "bg-zinc-900 hover:bg-black text-white shadow-zinc-900/20"
                                        : "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20"
                                        }`}
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {isSuspended ? <Check className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                            {isSuspended ? "CEZAYI KALDIR / GÜNCELLE" : "DONDURMAYI ONAYLA"}
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="px-6 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 text-xs font-black py-4 rounded-2xl transition-colors active:scale-95"
                                >
                                    VAZGEÇ
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}
