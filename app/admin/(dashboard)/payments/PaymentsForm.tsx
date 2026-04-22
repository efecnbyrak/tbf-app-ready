"use client";

import { useState } from "react";
import { savePaymentConfig } from "@/app/actions/payments";
import type { PaymentConfig, PaymentRate, CategoryRate } from "@/lib/payment-types";
import { EMPTY_RATE } from "@/lib/payment-types";
import { Loader2, School, MapPin, Trophy, ChevronDown, ChevronUp, Plus, Trash2, Banknote } from "lucide-react";

interface EkOdeme {
    id: string;
    aciklama: string;
    tutar: number;
}

interface ExtendedPaymentConfig extends PaymentConfig {
    ekOdemeler?: EkOdeme[];
}

interface Props {
    initialConfig: ExtendedPaymentConfig;
    allCategories: string[];
}

// Standard roles for Özel Lig categories
const OZEL_LIG_LABELS: { key: keyof PaymentRate; label: string }[] = [
    { key: "basHakem", label: "Baş Hakem" },
    { key: "yardimciHakem", label: "Yardımcı Hakem" },
    { key: "gozlemci", label: "Gözlemci" },
    { key: "masaGorevlisi", label: "Masa Görevlisi" },
    { key: "istatistikci", label: "İstatistikçi" },
    { key: "saglikci", label: "Sağlıkçı" },
    { key: "sahaKomiseri", label: "Saha Komiseri" },
];

// Bölge & Okul include 2. Yardımcı Hakem (for 3-referee finals)
const BOLGE_OKUL_LABELS: { key: keyof PaymentRate; label: string }[] = [
    { key: "basHakem", label: "Baş Hakem" },
    { key: "yardimciHakem", label: "1. Yardımcı Hakem" },
    { key: "ikinciYardimciHakem", label: "2. Yardımcı Hakem" },
    { key: "gozlemci", label: "Gözlemci" },
    { key: "masaGorevlisi", label: "Masa Görevlisi" },
    { key: "istatistikci", label: "İstatistikçi" },
    { key: "saglikci", label: "Sağlıkçı" },
    { key: "sahaKomiseri", label: "Saha Komiseri" },
];

function CurrencyInput({
    label,
    value,
    onChange,
    accent = "red",
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    accent?: "red" | "amber" | "blue" | "emerald";
}) {
    const ringColor =
        accent === "amber" ? "focus:ring-amber-400" :
        accent === "blue" ? "focus:ring-blue-400" :
        accent === "emerald" ? "focus:ring-emerald-400" :
        "focus:ring-red-500";

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.12em]">
                {label}
            </label>
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 select-none">₺</span>
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
                    className={`w-full pl-7 pr-3 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-black text-zinc-900 dark:text-white focus:ring-2 ${ringColor} focus:border-transparent outline-none transition-all`}
                />
            </div>
        </div>
    );
}

function RatesGrid({
    rate,
    onChange,
    accent = "red",
    labels,
}: {
    rate: PaymentRate;
    onChange: (r: PaymentRate) => void;
    accent?: "red" | "amber" | "blue" | "emerald";
    labels: { key: keyof PaymentRate; label: string }[];
}) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {labels.map(({ key, label }) => (
                <CurrencyInput
                    key={key}
                    label={label}
                    value={rate[key]}
                    accent={accent}
                    onChange={(v) => onChange({ ...rate, [key]: v })}
                />
            ))}
        </div>
    );
}

function SectionHeader({
    icon,
    color,
    title,
    subtitle,
}: {
    icon: React.ReactNode;
    color: string;
    title: string;
    subtitle: string;
}) {
    return (
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div>
                <h2 className="text-base font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                    {title}
                </h2>
                <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{subtitle}</p>
            </div>
        </div>
    );
}

function CategoryCard({
    category,
    onChange,
}: {
    category: CategoryRate;
    onChange: (r: PaymentRate) => void;
}) {
    const [open, setOpen] = useState(false);
    const hasAnyRate = Object.values(category.rates).some((v) => v > 0);

    return (
        <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${hasAnyRate ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-600"}`} />
                    <span className="text-sm font-black uppercase italic tracking-tight text-zinc-900 dark:text-white">
                        {category.name}
                    </span>
                    {hasAnyRate && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                            Fiyat girildi
                        </span>
                    )}
                </div>
                {open ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                )}
            </button>
            {open && (
                <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-700 pt-4">
                    <RatesGrid rate={category.rates} onChange={onChange} accent="amber" labels={OZEL_LIG_LABELS} />
                </div>
            )}
        </div>
    );
}

export function PaymentsForm({ initialConfig, allCategories }: Props) {
    const [okulMaclari, setOkulMaclari] = useState<PaymentRate>(initialConfig.okulMaclari);
    const [bolgeMaclari, setBolgeMaclari] = useState<PaymentRate>(initialConfig.bolgeMaclari);

    // Merge drive categories with saved config
    const buildKategoriler = (): CategoryRate[] => {
        const saved = initialConfig.kategoriler;
        const merged: CategoryRate[] = allCategories.map((cat) => {
            const existing = saved.find((k) => k.name === cat);
            return existing ?? { id: cat, name: cat, rates: { ...EMPTY_RATE } };
        });
        const extra = saved.filter((k) => !allCategories.includes(k.name));
        return [...merged, ...extra];
    };

    const [kategoriler, setKategoriler] = useState<CategoryRate[]>(buildKategoriler);
    const [ekOdemeler, setEkOdemeler] = useState<EkOdeme[]>(
        (initialConfig as ExtendedPaymentConfig).ekOdemeler || []
    );
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const updateCategory = (id: string, rates: PaymentRate) => {
        setSaved(false);
        setKategoriler((prev) => prev.map((k) => (k.id === id ? { ...k, rates } : k)));
    };

    const addEkOdeme = () => {
        const newId = `ek_${Date.now()}`;
        setEkOdemeler((prev) => [...prev, { id: newId, aciklama: "", tutar: 0 }]);
        setSaved(false);
    };

    const updateEkOdeme = (id: string, field: keyof EkOdeme, value: string | number) => {
        setSaved(false);
        setEkOdemeler((prev) => prev.map((e) => e.id === id ? { ...e, [field]: value } : e));
    };

    const removeEkOdeme = (id: string) => {
        setSaved(false);
        setEkOdemeler((prev) => prev.filter((e) => e.id !== id));
    };

    const handleSave = async () => {
        setLoading(true);
        setSaved(false);
        const config: any = { okulMaclari, bolgeMaclari, kategoriler, ekOdemeler };
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

            {/* ── 1. OKUL MAÇLARI ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <SectionHeader
                    icon={<School className="w-5 h-5 text-white" />}
                    color="bg-red-600 shadow-lg shadow-red-600/20"
                    title="Okul Maçları"
                    subtitle="Okul, İl ve İlçe maçları için standart ücret tablosu (Final maçlarında 2. Yardımcı Hakem dahil)"
                />
                <RatesGrid
                    rate={okulMaclari}
                    onChange={(r) => { setSaved(false); setOkulMaclari(r); }}
                    accent="red"
                    labels={BOLGE_OKUL_LABELS}
                />
            </div>

            {/* ── 2. ÖZEL LİG KATEGORİLERİ ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <SectionHeader
                    icon={<Trophy className="w-5 h-5 text-white" />}
                    color="bg-amber-500 shadow-lg shadow-amber-500/20"
                    title="Özel Lig"
                    subtitle={`Sistemdeki tüm kategoriler — ${kategoriler.length} kategori`}
                />

                {kategoriler.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <p className="text-sm font-black text-zinc-400 uppercase italic">
                            Henüz kategori verisi yok
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">
                            Drive senkronizasyonu yapıldıktan sonra kategoriler burada görünür.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {kategoriler.map((cat) => (
                            <CategoryCard
                                key={cat.id}
                                category={cat}
                                onChange={(r) => updateCategory(cat.id, r)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── 3. BÖLGE MAÇLARI ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <SectionHeader
                    icon={<MapPin className="w-5 h-5 text-white" />}
                    color="bg-blue-600 shadow-lg shadow-blue-600/20"
                    title="Bölge Maçları"
                    subtitle="Bölge haftaları maçları için standart ücret tablosu (Final maçlarında 2. Yardımcı Hakem dahil)"
                />
                <RatesGrid
                    rate={bolgeMaclari}
                    onChange={(r) => { setSaved(false); setBolgeMaclari(r); }}
                    accent="blue"
                    labels={BOLGE_OKUL_LABELS}
                />
            </div>

            {/* ── 4. EK ÖDEMELER ── */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                <SectionHeader
                    icon={<Banknote className="w-5 h-5 text-white" />}
                    color="bg-emerald-600 shadow-lg shadow-emerald-600/20"
                    title="Ek Ödemeler"
                    subtitle="Özel durumlar, ulaşım veya diğer ek ücretler"
                />

                <div className="space-y-3">
                    {ekOdemeler.map((ek) => (
                        <div key={ek.id} className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-700">
                            <input
                                type="text"
                                value={ek.aciklama}
                                onChange={(e) => updateEkOdeme(ek.id, "aciklama", e.target.value)}
                                placeholder="Açıklama (örn: Ulaşım, Konaklama...)"
                                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
                            />
                            <div className="relative w-32 shrink-0">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-400 select-none">₺</span>
                                <input
                                    type="number"
                                    min={0}
                                    step={1}
                                    value={ek.tutar === 0 ? "" : ek.tutar}
                                    placeholder="0"
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(/[^0-9]/g, "");
                                        updateEkOdeme(ek.id, "tutar", raw === "" ? 0 : parseInt(raw, 10));
                                    }}
                                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-black text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => removeEkOdeme(ek.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Kaldır"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addEkOdeme}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-sm font-semibold"
                    >
                        <Plus className="w-4 h-4" />
                        Ek Ödeme Ekle
                    </button>
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
