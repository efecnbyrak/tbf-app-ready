"use client";

import { useState } from "react";
import { cleanupOldAvailability, cleanupCurrentAvailability, moveFormsToLastWeek } from "@/app/actions/admin-users";
import { Trash2, AlertTriangle, CalendarX, ArrowLeftCircle } from "lucide-react";

export function CleanupButton() {
    const [loading, setLoading] = useState(false);
    const [showConfirmOld, setShowConfirmOld] = useState(false);
    const [showConfirmCurrent, setShowConfirmCurrent] = useState(false);
    const [showConfirmMove, setShowConfirmMove] = useState(false);

    const closeAll = () => {
        setShowConfirmOld(false);
        setShowConfirmCurrent(false);
        setShowConfirmMove(false);
    };

    const handleCleanupOld = async () => {
        setLoading(true);
        try {
            const res = await cleanupOldAvailability();
            alert(`${res.count} adet eski uygunluk formu başarıyla silindi.`);
            closeAll();
        } catch (error) {
            console.error(error);
            alert("Temizleme işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleCleanupCurrent = async () => {
        setLoading(true);
        try {
            const res = await cleanupCurrentAvailability();
            alert(`${res.count} adet güncel hafta uygunluk formu başarıyla silindi.`);
            closeAll();
        } catch (error) {
            console.error(error);
            alert("Temizleme işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleMoveToLastWeek = async () => {
        setLoading(true);
        try {
            const res = await moveFormsToLastWeek();
            if (res.count === 0) {
                alert("Güncel haftada taşınacak form bulunamadı.");
            } else {
                alert(`${res.count} adet form geçen haftaya başarıyla taşındı.`);
            }
            closeAll();
        } catch (error) {
            console.error(error);
            alert("Taşıma işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {/* Geçen Haftaya Taşı */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowConfirmMove(!showConfirmMove);
                        setShowConfirmOld(false);
                        setShowConfirmCurrent(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-colors dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400"
                >
                    <ArrowLeftCircle className="w-4 h-4" />
                    Geçen Haftaya Taşı
                </button>

                {showConfirmMove && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-blue-200 dark:border-blue-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2 text-blue-600">
                            <ArrowLeftCircle size={16} />
                            <h4 className="text-sm font-bold">Geçen Haftaya Taşı</h4>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                            <strong className="text-blue-600 dark:text-blue-400">Güncel haftanın tüm uygunluk formları</strong> geçen haftaya taşınacaktır.
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                            Form verileri silinmez, sadece hafta tarihleri 7 gün geri alınır. Örneğin hedef 18.04 ise formlar 11.04 haftasına taşınır.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleMoveToLastWeek}
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50"
                            >
                                {loading ? "Taşınıyor..." : "Evet, Taşı"}
                            </button>
                            <button
                                onClick={() => setShowConfirmMove(false)}
                                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold py-2 rounded transition-colors dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-300"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Eski Verileri Temizle */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowConfirmOld(!showConfirmOld);
                        setShowConfirmCurrent(false);
                        setShowConfirmMove(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-sm font-semibold transition-colors dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300"
                >
                    <Trash2 className="w-4 h-4" />
                    Eski Verileri Temizle
                </button>

                {showConfirmOld && (
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
                                onClick={handleCleanupOld}
                                disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50"
                            >
                                {loading ? "Temizleniyor..." : "Evet, Sil"}
                            </button>
                            <button
                                onClick={() => setShowConfirmOld(false)}
                                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold py-2 rounded transition-colors"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Güncel Verileri Temizle */}
            <div className="relative">
                <button
                    onClick={() => {
                        setShowConfirmCurrent(!showConfirmCurrent);
                        setShowConfirmOld(false);
                        setShowConfirmMove(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg text-sm font-semibold transition-colors dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400"
                >
                    <CalendarX className="w-4 h-4" />
                    Güncel Verileri Temizle
                </button>

                {showConfirmCurrent && (
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-orange-200 dark:border-orange-800 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-2 text-red-600">
                            <AlertTriangle size={16} />
                            <h4 className="text-sm font-bold">⚠️ Dikkat!</h4>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">
                            <strong className="text-red-600 dark:text-red-400">Güncel haftanın tüm uygunluk formları</strong> kalıcı olarak silinecektir.
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                            Bu işlem geri alınamaz. Tüm kullanıcıların bu haftaki uygunluk bilgileri kaybolacaktır.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCleanupCurrent}
                                disabled={loading}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded transition-colors disabled:opacity-50"
                            >
                                {loading ? "Temizleniyor..." : "Evet, Güncel Haftayı Sil"}
                            </button>
                            <button
                                onClick={() => setShowConfirmCurrent(false)}
                                className="flex-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 text-xs font-bold py-2 rounded transition-colors dark:bg-zinc-700 dark:hover:bg-zinc-600 dark:text-zinc-300"
                            >
                                Vazgeç
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
