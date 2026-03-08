"use client";

import { useState } from "react";
import { updateUserIBAN } from "@/app/actions/iban";
import { Loader2, CreditCard, ShieldCheck, AlertCircle } from "lucide-react";
import { isValidTurkishIBAN } from "@/lib/iban-validator";

interface IBANRequirementModalProps {
    isOpen: boolean;
}

export function IBANRequirementModal({ isOpen }: IBANRequirementModalProps) {
    const [iban, setIban] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        const formattedIban = iban.replace(/\s/g, "").toUpperCase();

        if (formattedIban.length !== 26) {
            setError("IBAN numarası 26 haneli olmalıdır.");
            return;
        }

        if (!isValidTurkishIBAN(formattedIban)) {
            setError("Geçersiz IBAN formatı. Lütfen kontrol ediniz.");
            return;
        }

        setLoading(true);
        const result = await updateUserIBAN(formattedIban);
        setLoading(false);

        if (result.success) {
            window.location.reload();
        } else {
            setError(result.error || "Bir hata oluştu.");
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4">
            <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden relative">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <CreditCard className="w-32 h-32" />
                </div>

                <div className="p-8 md:p-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30 rotate-3">
                            <CreditCard className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white italic tracking-tighter uppercase leading-none">
                                IBAN Bilgisi Gerekli
                            </h2>
                            <p className="text-[10px] font-black text-red-600 uppercase tracking-widest italic mt-1">Sistem Güncellemesi</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm font-bold leading-relaxed">
                                Sayın Görevli, sistemimizdeki ödeme süreçlerinin aksamaması için <span className="text-zinc-900 dark:text-white font-black italic">IBAN numaranızı</span> tanımlamanız gerekmektedir.
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase italic">
                                <ShieldCheck className="w-4 h-4" />
                                Güvenli 256-bit Şifreleme aktif
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest italic ml-1">
                                    TR ile başlayan 26 haneli IBAN No
                                </label>
                                <input
                                    type="text"
                                    value={iban}
                                    onChange={(e) => setIban(e.target.value)}
                                    placeholder="TR00 0000 0000 0000 0000 0000 00"
                                    className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-black italic tracking-wider focus:ring-4 focus:ring-red-600/10 focus:border-red-600 outline-none transition-all placeholder:text-zinc-300"
                                    disabled={loading}
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold animate-shake">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 py-5 rounded-2xl font-black text-xs tracking-widest uppercase italic hover:bg-black dark:hover:bg-zinc-100 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 relative overflow-hidden group shadow-xl shadow-zinc-950/20"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        BİLGİLERİMİ KAYDET
                                        <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-[9px] text-zinc-400 font-bold uppercase italic text-center tracking-tight leading-loose">
                            Bu alan zorunludur. IBAN bilginizi kaydetmeden sisteme devam edemezsiniz.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
}
