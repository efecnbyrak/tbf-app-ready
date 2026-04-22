"use client";

import { useState } from "react";
import { savePaymentConfig, PaymentConfig, MatchPaymentRate, SpecialLeagueRate } from "@/app/actions/payments";
import { Loader2, Plus, Trash2, Banknote, Trophy, School } from "lucide-react";

interface Props {
    initialConfig: PaymentConfig;
}

function CurrencyInput({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em]">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400 dark:text-zinc-500 select-none">
                    ₺
                </span>
                <input
                    type="number"
                    min={0}
                    step={1}
                    value={value === 0 ? "" : value}
                    placeholder="0"
                    onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        onChange(raw === "" ? 0 : parseInt(raw, 10));
                    }}
                    className="w-full pl-8 pr-3 py-3 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                />
            </div>
        </div>
    );
}

function StandardMatchCard({
    title,
    icon,
    rate,
    onChange,
}: {
    title: string;
    icon: React.ReactNode;
    rate: MatchPaymentRate;
    onChange: (r: MatchPaymentRate) => void;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    {icon}
                </div>
                <h3 className="text-sm font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                    {title}
                </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CurrencyInput
                    label="Baş Hakem (1. Hakem)"
                    value={rate.basHakem}
                    onChange={(v) => onChange({ ...rate, basHakem: v })}
                />
                <CurrencyInput
                    label="Yardımcı Hakem (2. Hakem)"
                    value={rate.yardimciHakem}
                    onChange={(v) => onChange({ ...rate, yardimciHakem: v })}
                />
            </div>
        </div>
    );
}

export function PaymentsForm({ initialConfig }: Props) {
    const [standardMatches, setStandardMatches] = useState(initialConfig.standardMatches);
    const [specialLeagues, setSpecialLeagues] = useState<SpecialLeagueRate[]>(
        initialConfig.specialLeagues || []
    );
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const updateStandard = (key: keyof typeof standardMatches, rate: MatchPaymentRate) => {
        setSaved(false);
        setStandardMatches((prev) => ({ ...prev, [key]: rate }));
    };

    const addLeague = () => {
        setSaved(false);
        setSpecialLeagues((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                name: "",
                basHakem: 0,
                yardimciHakem: 0,
            },
        ]);
    };

    const removeLeague = (id: string) => {
        setSaved(false);
        setSpecialLeagues((prev) => prev.filter((l) => l.id !== id));
    };

    const updateLeague = (id: string, updates: Partial<SpecialLeagueRate>) => {
        setSaved(false);
        setSpecialLeagues((prev) =>
            prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
        );
    };

    const handleSave = async () => {
        setLoading(true);
        setSaved(false);

        const config: PaymentConfig = { standardMatches, specialLeagues };
        const result = await savePaymentConfig(config);

        setLoading(false);
        if (result.success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } else {
            alert(result.error || "Bir hata oluştu.");
        }
    };

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Standard Matches Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                        <School className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                            Okul / İl / İlçe Maçları
                        </h2>
                        <p className="text-[11px] text-zinc-400 font-medium">
                            Yerel lig maçları için standart ücret tablosu
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StandardMatchCard
                        title="Okul Maçları"
                        icon={<span className="text-xs font-black text-red-600">OKL</span>}
                        rate={standardMatches.okul}
                        onChange={(r) => updateStandard("okul", r)}
                    />
                    <StandardMatchCard
                        title="İl Maçları"
                        icon={<span className="text-xs font-black text-red-600">İL</span>}
                        rate={standardMatches.il}
                        onChange={(r) => updateStandard("il", r)}
                    />
                    <StandardMatchCard
                        title="İlçe Maçları"
                        icon={<span className="text-xs font-black text-red-600">İLÇ</span>}
                        rate={standardMatches.ilce}
                        onChange={(r) => updateStandard("ilce", r)}
                    />
                </div>

                {/* Preview summary */}
                <div className="mt-5 grid grid-cols-3 gap-3">
                    {(
                        [
                            { label: "Okul", key: "okul" },
                            { label: "İl", key: "il" },
                            { label: "İlçe", key: "ilce" },
                        ] as const
                    ).map(({ label, key }) => (
                        <div
                            key={key}
                            className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-100 dark:border-zinc-800"
                        >
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1">
                                {label}
                            </p>
                            <div className="space-y-0.5">
                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Baş: <span className="text-red-600 dark:text-red-400">
                                        {standardMatches[key].basHakem.toLocaleString("tr-TR")} ₺
                                    </span>
                                </p>
                                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    Yrd: <span className="text-zinc-500">
                                        {standardMatches[key].yardimciHakem.toLocaleString("tr-TR")} ₺
                                    </span>
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Special Leagues Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                                Özel Ligler
                            </h2>
                            <p className="text-[11px] text-zinc-400 font-medium">
                                Özel lig ve üniversite maçları için ücret tablosu
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={addLeague}
                        className="flex items-center gap-1.5 px-4 py-2 bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-600 hover:dark:bg-red-600 hover:dark:text-white transition-all active:scale-95"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Lig Ekle
                    </button>
                </div>

                {specialLeagues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            <Banknote className="w-7 h-7 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-sm font-black text-zinc-400 uppercase italic">
                            Henüz özel lig eklenmedi
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                            Üstteki &quot;Lig Ekle&quot; butonuna tıklayarak yeni lig ekleyebilirsiniz.
                        </p>
                        <button
                            type="button"
                            onClick={addLeague}
                            className="mt-4 flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-black text-zinc-400 hover:border-red-400 hover:text-red-500 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            İlk Ligi Ekle
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {specialLeagues.map((league, idx) => (
                            <div
                                key={league.id}
                                className="relative bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5"
                            >
                                {/* League number badge */}
                                <div className="absolute -top-3 left-4 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                    {idx + 1}. Lig
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        {/* League name input */}
                                        <div className="mb-4">
                                            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.15em] block mb-1.5">
                                                Lig Adı
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Örn: Süper Lig, 1. Lig, BSL..."
                                                value={league.name}
                                                onChange={(e) =>
                                                    updateLeague(league.id, { name: e.target.value })
                                                }
                                                className="w-full px-4 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-xl text-sm font-semibold text-zinc-900 dark:text-white focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none transition-all"
                                            />
                                            <p className="text-[10px] text-zinc-400 mt-1">
                                                Bu isim, Excel&apos;deki KATEGORİ sütunuyla eşleştirilir.
                                            </p>
                                        </div>
                                        {/* Payment inputs */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <CurrencyInput
                                                label="Baş Hakem (1. Hakem)"
                                                value={league.basHakem}
                                                onChange={(v) =>
                                                    updateLeague(league.id, { basHakem: v })
                                                }
                                            />
                                            <CurrencyInput
                                                label="Yardımcı Hakem (2. Hakem)"
                                                value={league.yardimciHakem}
                                                onChange={(v) =>
                                                    updateLeague(league.id, { yardimciHakem: v })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeLeague(league.id)}
                                        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all mt-1"
                                        title="Ligi sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addLeague}
                            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-2xl text-xs font-black text-zinc-400 hover:border-amber-400 hover:text-amber-500 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            Yeni Lig Ekle
                        </button>
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <div>
                    <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                        Son kaydedilme
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                        Bu yapılandırma Excel atama raporunda &quot;Ödemeler&quot; sayfasına otomatik uygulanır.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className={`w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-xs font-black tracking-widest uppercase italic transition-all active:scale-95 shadow-lg disabled:opacity-50 ${
                        saved
                            ? "bg-emerald-600 text-white shadow-emerald-600/20"
                            : "bg-red-700 text-white hover:bg-black shadow-red-700/20"
                    }`}
                >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {saved ? "✓ Kaydedildi" : "Ayarları Kaydet"}
                </button>
            </div>
        </div>
    );
}
