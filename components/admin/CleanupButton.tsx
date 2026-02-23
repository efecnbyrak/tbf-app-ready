"use client";

import { useState } from "react";
import { cleanupOldAvailability } from "@/app/actions/admin-users";
import { Trash2, AlertTriangle } from "lucide-react";

export function CleanupButton() {
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleCleanup = async () => {
        setLoading(true);
        try {
            const res = await cleanupOldAvailability();
            alert(`${res.count} adet eski uygunluk formu başarıyla silindi.`);
            setShowConfirm(false);
        } catch (error) {
            console.error(error);
            alert("Temizleme işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowConfirm(!showConfirm)}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-sm font-semibold transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
            >
                <Trash2 className="w-4 h-4" />
                Eski Verileri Temizle
            </button>

            {showConfirm && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 mb-2 text-amber-600">
                        <AlertTriangle size={16} />
                        <h4 className="text-sm font-bold">Veri Temizleme Onayı</h4>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">
                        Geçen haftadan eski tüm uygunluk formları kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={handleCleanup}
                            disabled={loading}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50"
                        >
                            {loading ? "Temizleniyor..." : "Evet, Sil"}
                        </button>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold py-2 rounded transition-colors"
                        >
                            Vazgeç
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
