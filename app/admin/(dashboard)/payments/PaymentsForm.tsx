"use client";

import { useState } from "react";
import { savePaymentConfig, PaymentConfig, MatchPaymentRate, SpecialLeagueRate } from "@/app/actions/payments";
import { Loader2, Banknote, Trophy, School, MapPin } from "lucide-react";

interface Props {
    initialConfig: PaymentConfig;
    driveCategories: string[];
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
    badge,
    rate,
    onChange,
}: {
    title: string;
    badge: string;
    rate: MatchPaymentRate;
    onChange: (r: MatchPaymentRate) => void;
}) {
    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-white">{badge}</span>
                </div>
                <h3 className="text-sm font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                    {title}
                </h3>
            </div>
            <div className="space-y-3">
                <CurrencyInput
                    label="Baş Hakem"
                    value={rate.basHakem}
                    onChange={(v) => onChange({ ...rate, basHakem: v })}
                />
                <CurrencyInput
                    label="Yardımcı Hakem"
                    value={rate.yardimciHakem}
                    onChange={(v) => onChange({ ...rate, yardimciHakem: v })}
                />
            </div>
        </div>
    );
}

export function PaymentsForm({ initialConfig, driveCategories }: Props) {
    const [standardMatches, setStandardMatches] = useState(initialConfig.standardMatches);

    // Merge drive categories with saved config — no duplicates
    const mergedLeagues: SpecialLeagueRate[] = driveCategories.map((cat) => {
        const existing = initialConfig.specialLeagues.find((l) => l.name === cat);
        return existing ?? { id: cat, name: cat, basHakem: 0, yardimciHakem: 0 };
    });
    // Also include any saved leagues that are no longer in drive (preserve data)
    const savedOnly = initialConfig.specialLeagues.filter(
        (l) => !driveCategories.includes(l.name)
    );
    const [specialLeagues, setSpecialLeagues] = useState<SpecialLeagueRate[]>([
        ...mergedLeagues,
        ...savedOnly,
    ]);

    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const updateStandard = (key: keyof typeof standardMatches, rate: MatchPaymentRate) => {
        setSaved(false);
        setStandardMatches((prev) => ({ ...prev, [key]: rate }));
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
        <div className="space-y-8 max-w-4xl">

            {/* ── 1. OKUL / İL / İLÇE ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
                        <School className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                            Okul / İl / İlçe Maçları
                        </h2>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            Yerel lig maçları için standart ücret tablosu
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StandardMatchCard
                        title="Okul Maçları"
                        badge="OKL"
                        rate={standardMatches.okul}
                        onChange={(r) => updateStandard("okul", r)}
                    />
                    <StandardMatchCard
                        title="İl Maçları"
                        badge="İL"
                        rate={standardMatches.il}
                        onChange={(r) => updateStandard("il", r)}
                    />
                    <StandardMatchCard
                        title="İlçe Maçları"
                        badge="İLÇ"
                        rate={standardMatches.ilce}
                        onChange={(r) => updateStandard("ilce", r)}
                    />
                </div>
            </div>

            {/* ── 2. ÖZEL LİG ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                            Özel Lig
                        </h2>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            Drive&apos;daki Özel Lig &amp; Üniversite dosyalarından otomatik çekilir
                        </p>
                    </div>
                </div>

                {specialLeagues.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-3">
                            <Banknote className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
                        </div>
                        <p className="text-sm font-black text-zinc-400 uppercase italic">
                            Henüz özel lig verisi yok
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                            Drive senkronizasyonu yapıldıktan sonra kategoriler burada görünür.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {specialLeagues.map((league) => (
                            <div
                                key={league.id}
                                className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                    <h3 className="text-sm font-black uppercase italic tracking-tight text-zinc-900 dark:text-white truncate">
                                        {league.name}
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <CurrencyInput
                                        label="Baş Hakem"
                                        value={league.basHakem}
                                        onChange={(v) => updateLeague(league.id, { basHakem: v })}
                                    />
                                    <CurrencyInput
                                        label="Yardımcı Hakem"
                                        value={league.yardimciHakem}
                                        onChange={(v) => updateLeague(league.id, { yardimciHakem: v })}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── 3. BÖLGE MAÇLARI ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
                        <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-base font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                            Bölge Maçları
                        </h2>
                        <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
                            Bölge haftaları maçları için standart ücret tablosu
                        </p>
                    </div>
                </div>

                <div className="max-w-sm">
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-black text-white">BLG</span>
                            </div>
                            <h3 className="text-sm font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                                Bölge Maçı
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <CurrencyInput
                                label="Baş Hakem"
                                value={standardMatches.bolge.basHakem}
                                onChange={(v) => updateStandard("bolge", { ...standardMatches.bolge, basHakem: v })}
                            />
                            <CurrencyInput
                                label="Yardımcı Hakem"
                                value={standardMatches.bolge.yardimciHakem}
                                onChange={(v) => updateStandard("bolge", { ...standardMatches.bolge, yardimciHakem: v })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Kaydet ── */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-between bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm">
                <p className="text-xs text-zinc-400">
                    Bu yapılandırma Excel atama raporunda &quot;Ödemeler&quot; sayfasına otomatik uygulanır.
                </p>
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
