"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createAssignment, updateAssignment, deleteAssignment, getAssignments } from "@/app/actions/atamalar";
import {
    ClipboardList, Plus, X, Pencil, Trash2, Search, ChevronDown,
    Download, RefreshCw, CheckCircle2, AlertCircle, Eye,
} from "lucide-react";

const LIG_TURU_OPTIONS = ["Yerel Ligler", "Özel Lig ve Üniversite"];
const SEZON_OPTIONS = ["2021-2022", "2022-2023", "2023-2024", "2024-2025", "2025-2026"];

function getCurrentSezon(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    const start = m >= 9 ? y : y - 1;
    return `${start}-${start + 1}`;
}

function getSezonFromDate(tarih: Date | string): string {
    const d = typeof tarih === "string" ? new Date(tarih) : tarih;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const start = m >= 9 ? y : y - 1;
    return `${start}-${start + 1}`;
}

interface GameAssignment {
    id: number;
    tarih: Date | string;
    saat?: string | null;
    salon?: string | null;
    ligTuru?: string | null;
    hafta?: number | null;
    aTeam: string;
    bTeam: string;
    kategori?: string | null;
    grup?: string | null;
    hakem1?: string | null;
    hakem2?: string | null;
    sayiGorevlisi?: string | null;
    saatGorevlisi?: string | null;
    sutSaatiGorevlisi?: string | null;
    gozlemci?: string | null;
    sahaKomiseri?: string | null;
    saglikci?: string | null;
    istatistikci1?: string | null;
    istatistikci2?: string | null;
}

interface PersonOption { name: string; }

interface Props {
    initialAssignments: GameAssignment[];
    teamNames: string[];
    categories: string[];
    groups: string[];
    salons: string[];
    referees: PersonOption[];
    tableOfficials: PersonOption[];
    observers: PersonOption[];
    fieldCommissioners: PersonOption[];
    healthOfficials: PersonOption[];
    statisticians: PersonOption[];
    currentWeek: number;
    season: string;
}

const EMPTY_FORM = {
    tarih: "", saat: "", salon: "", ligTuru: "", hafta: "",
    aTeam: "", bTeam: "", kategori: "", grup: "",
    hakem1: "", hakem2: "",
    sayiGorevlisi: "", saatGorevlisi: "", sutSaatiGorevlisi: "",
    gozlemci: "", sahaKomiseri: "", saglikci: "",
    istatistikci1: "", istatistikci2: "",
};

function formatDate(d: Date | string): string {
    if (!d) return "-";
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return String(d);
    const dd = date.getDate().toString().padStart(2, "0");
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function toInputDate(d: Date | string): string {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
}

const REFERENCE_WEEK = 31;
const REFERENCE_MONDAY_MS = new Date("2026-04-06T00:00:00.000Z").getTime();
function getWeekLabel(weekNumber: number): string {
    const diffMs = (weekNumber - REFERENCE_WEEK) * 7 * 24 * 60 * 60 * 1000;
    const start = new Date(REFERENCE_MONDAY_MS + diffMs);
    const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) => `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}.${d.getUTCFullYear()}`;
    return `${fmt(start)} - ${fmt(end)}`;
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
    if (!value) return null;
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{value}</span>
        </div>
    );
}

function SearchableSelect({
    value, onChange, options, placeholder, label,
}: {
    value: string;
    onChange: (v: string) => void;
    options: PersonOption[];
    placeholder?: string;
    label?: string;
}) {
    const [search, setSearch] = useState("");
    const [open, setOpen] = useState(false);

    const filtered = useMemo(() => {
        if (!search) return options;
        const s = search.toLowerCase();
        return options.filter(o => o.name.toLowerCase().includes(s));
    }, [search, options]);

    return (
        <div className="relative">
            {label && <label className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1 uppercase tracking-wide">{label}</label>}
            <button
                type="button"
                onClick={() => { setOpen(!open); setSearch(""); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-left hover:border-red-400 transition-colors"
            >
                <span className={value ? "text-zinc-900 dark:text-white" : "text-zinc-400"}>
                    {value || placeholder || "— Seçiniz —"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
            </button>
            {open && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl max-h-52 flex flex-col">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
                        <div className="flex items-center gap-2 px-2 py-1 bg-zinc-50 dark:bg-zinc-900 rounded">
                            <Search className="w-3 h-3 text-zinc-400" />
                            <input
                                autoFocus
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Ara..."
                                className="flex-1 bg-transparent text-xs outline-none text-zinc-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <button type="button" onClick={() => { onChange(""); setOpen(false); }}
                            className="w-full text-left px-3 py-2 text-xs text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700">
                            — Boş —
                        </button>
                        {filtered.slice(0, 100).map(o => (
                            <button key={o.name} type="button" onClick={() => { onChange(o.name); setOpen(false); setSearch(""); }}
                                className={`w-full text-left px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-700 ${value === o.name ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 font-semibold" : "text-zinc-800 dark:text-zinc-200"}`}>
                                {o.name}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-center text-xs text-zinc-400">Sonuç bulunamadı</div>
                        )}
                    </div>
                </div>
            )}
            {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
        </div>
    );
}

export function AtamalarClient({
    initialAssignments, teamNames, categories, groups, salons,
    referees, tableOfficials, observers, fieldCommissioners, healthOfficials, statisticians,
    currentWeek, season,
}: Props) {
    const router = useRouter();
    const [assignments, setAssignments] = useState<GameAssignment[]>(initialAssignments);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const [selectedMatch, setSelectedMatch] = useState<GameAssignment | null>(null);

    const [tableSearch, setTableSearch] = useState("");
    const [filterSezon, setFilterSezon] = useState(getCurrentSezon());
    const [filterLig, setFilterLig] = useState("");
    const [filterHafta, setFilterHafta] = useState("");
    const [fetchingSezon, setFetchingSezon] = useState(false);

    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportLig, setExportLig] = useState("");

    const [syncStatus, setSyncStatus] = useState<{ imported: number } | null>(null);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [importResult, setImportResult] = useState<{
        imported: number; updated: number; skipped: number; errors: string[];
        total: number; seasons?: string[]; firstTime?: boolean;
    } | null>(null);

    const teamOptions = teamNames.map(t => ({ name: t }));
    const categoryOptions = categories.map(c => ({ name: c }));
    const groupOptions = groups.map(g => ({ name: g }));
    const salonOptions = salons.map(s => ({ name: s }));

    const maxHafta = currentWeek + 2;
    const haftaOptions = Array.from({ length: maxHafta }, (_, i) => i + 1)
        .map(w => ({ name: String(w), label: `${w}. Hafta (${getWeekLabel(w)})` }));

    // Auto-sync: only on mount
    useEffect(() => {
        fetch("/api/atamalar/sync")
            .then(r => r.json())
            .then(data => {
                if (data.success && data.imported > 0) {
                    setSyncStatus({ imported: data.imported });
                    router.refresh();
                }
            })
            .catch(() => {});
    }, []);

    // Season change: fetch assignments for new season
    async function handleSezonChange(sezon: string) {
        if (sezon === filterSezon) return;
        setFilterSezon(sezon);
        setFilterLig("");
        setFilterHafta("");
        setTableSearch("");
        setFetchingSezon(true);
        try {
            const result = await getAssignments(sezon);
            if (result.success) setAssignments((result.assignments || []) as any);
        } catch {}
        setFetchingSezon(false);
    }

    function openCreate() {
        setForm({ ...EMPTY_FORM, hafta: String(currentWeek) });
        setEditingId(null);
        setError("");
        setModalOpen(true);
    }

    function openEdit(a: GameAssignment) {
        setForm({
            tarih: toInputDate(a.tarih),
            saat: a.saat || "",
            salon: a.salon || "",
            ligTuru: a.ligTuru || "",
            hafta: a.hafta ? String(a.hafta) : "",
            aTeam: a.aTeam || "",
            bTeam: a.bTeam || "",
            kategori: a.kategori || "",
            grup: a.grup || "",
            hakem1: a.hakem1 || "",
            hakem2: a.hakem2 || "",
            sayiGorevlisi: a.sayiGorevlisi || "",
            saatGorevlisi: a.saatGorevlisi || "",
            sutSaatiGorevlisi: a.sutSaatiGorevlisi || "",
            gozlemci: a.gozlemci || "",
            sahaKomiseri: a.sahaKomiseri || "",
            saglikci: a.saglikci || "",
            istatistikci1: a.istatistikci1 || "",
            istatistikci2: a.istatistikci2 || "",
        });
        setEditingId(a.id);
        setError("");
        setModalOpen(true);
    }

    function setField(key: keyof typeof EMPTY_FORM, value: string) {
        setForm(prev => ({ ...prev, [key]: value }));
    }

    function clientValidate(): string | null {
        if (form.hakem1 && form.hakem2 && form.hakem1 === form.hakem2) return "1. Hakem ve 2. Hakem aynı kişi olamaz.";
        if (form.aTeam && form.bTeam && form.aTeam === form.bTeam) return "A Takımı ve B Takımı aynı olamaz.";
        if (form.tarih && form.saat) {
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];
            if (form.tarih === todayStr) {
                const [h, m] = form.saat.split(":").map(Number);
                const nowMin = today.getHours() * 60 + today.getMinutes();
                if (h * 60 + m <= nowMin) return "Bugünkü bir maç için geçmiş saat verilemez.";
            }
        }
        return null;
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const clientErr = clientValidate();
        if (clientErr) { setError(clientErr); return; }
        setError("");

        startTransition(async () => {
            const result = editingId !== null
                ? await updateAssignment(editingId, form as any)
                : await createAssignment(form as any);

            if (!result.success) { setError(result.error || "Bir hata oluştu"); return; }
            setModalOpen(false);
            router.refresh();
        });
    }

    function handleDelete(id: number) {
        startTransition(async () => {
            const result = await deleteAssignment(id);
            if (result.success) {
                setAssignments(prev => prev.filter(a => a.id !== id));
                setDeleteConfirmId(null);
            }
        });
    }

    const filtered = useMemo(() => {
        let list = assignments;
        if (filterLig) list = list.filter(a => a.ligTuru === filterLig);
        if (filterHafta) list = list.filter(a => String(a.hafta) === filterHafta);
        if (tableSearch) {
            const s = tableSearch.toLowerCase();
            list = list.filter(a =>
                a.aTeam?.toLowerCase().includes(s) ||
                a.bTeam?.toLowerCase().includes(s) ||
                a.salon?.toLowerCase().includes(s) ||
                a.hakem1?.toLowerCase().includes(s) ||
                a.hakem2?.toLowerCase().includes(s) ||
                formatDate(a.tarih).includes(s) ||
                a.ligTuru?.toLowerCase().includes(s)
            );
        }
        return list;
    }, [assignments, tableSearch, filterLig, filterHafta]);

    const COLS = [
        { key: "tarih", label: "TARİH", width: "w-24" },
        { key: "saat", label: "SAAT", width: "w-14" },
        { key: "salon", label: "SALON / MEKAN", width: "w-40" },
        { key: "aTeam", label: "A TAKIMI", width: "w-32" },
        { key: "bTeam", label: "B TAKIMI", width: "w-32" },
        { key: "kategori", label: "KATEGORİ", width: "w-24" },
        { key: "hakem1", label: "I. HAKEM", width: "w-32" },
        { key: "hakem2", label: "II. HAKEM", width: "w-32" },
    ];

    const isYerelLigler = form.ligTuru === "Yerel Ligler";

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase italic underline decoration-red-600 decoration-4">
                        Atamalar
                    </h1>
                    <p className="text-zinc-500 font-medium italic mt-1">
                        {filterSezon} Sezonu — {fetchingSezon ? "Yükleniyor..." : `${assignments.length} atama`}
                    </p>
                    {syncStatus && syncStatus.imported > 0 && (
                        <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {syncStatus.imported} yeni maç Drive'dan otomatik aktarıldı.
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setImportResult(null); setImportModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Arşivden Aktar
                    </button>
                    <button
                        onClick={() => setExportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
                    >
                        <Download className="w-4 h-4" />
                        Excel İndir
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 text-white font-bold rounded-xl transition-colors shadow-md text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Atama
                    </button>
                </div>
            </header>

            {/* Filters */}
            <div className="space-y-3">
                {/* Row 1: Search + Season */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 shadow-sm">
                        <Search className="w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Takım, salon, hakem ara..."
                            value={tableSearch}
                            onChange={e => setTableSearch(e.target.value)}
                            className="w-52 bg-transparent text-sm text-zinc-900 dark:text-white outline-none placeholder:text-zinc-400"
                        />
                    </div>
                    {/* Season (Üst Kategori) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-wider mr-1">Sezon:</span>
                        {SEZON_OPTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => handleSezonChange(s)}
                                disabled={fetchingSezon}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-60 ${filterSezon === s ? "bg-red-700 text-white border-red-700 shadow-sm" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-red-400"}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Row 2: Lig Türü */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-wider mr-1">Lig:</span>
                    <button
                        onClick={() => { setFilterLig(""); setFilterHafta(""); }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${!filterLig ? "bg-red-700 text-white border-red-700 shadow-sm" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-red-400"}`}
                    >
                        Tümü ({assignments.length})
                    </button>
                    {LIG_TURU_OPTIONS.map(l => {
                        const count = assignments.filter(a => a.ligTuru === l).length;
                        return (
                            <button
                                key={l}
                                onClick={() => { setFilterLig(l === filterLig ? "" : l); setFilterHafta(""); }}
                                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${filterLig === l ? "bg-red-700 text-white border-red-700 shadow-sm" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-red-400"}`}
                            >
                                {l} ({count})
                            </button>
                        );
                    })}
                </div>

                {/* Row 3: Hafta (only for Yerel Ligler) */}
                {filterLig === "Yerel Ligler" && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Hafta:</span>
                        <button
                            onClick={() => setFilterHafta("")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${!filterHafta ? "bg-red-700 text-white border-red-700 shadow-sm" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-red-400"}`}
                        >
                            Tümü
                        </button>
                        {/* Show available weeks from current data */}
                        {Array.from(new Set(assignments.filter(a => a.ligTuru === "Yerel Ligler" && a.hafta).map(a => a.hafta!))).sort((a, b) => a - b).map(h => (
                            <button
                                key={h}
                                onClick={() => setFilterHafta(String(h) === filterHafta ? "" : String(h))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterHafta === String(h) ? "bg-red-700 text-white border-red-700 shadow-sm" : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-red-400"}`}
                            >
                                {h}. Hafta
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            {fetchingSezon ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="w-6 h-6 text-zinc-400 animate-spin" />
                    <span className="ml-3 text-zinc-500 font-medium">{filterSezon} sezonu yükleniyor...</span>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ClipboardList className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                    <p className="text-zinc-500 font-medium">
                        {tableSearch || filterLig ? "Arama sonucu bulunamadı." : "Bu sezon için atama bulunamadı."}
                    </p>
                    {!tableSearch && !filterLig && (
                        <button onClick={openCreate} className="mt-4 text-sm text-red-600 hover:text-red-700 font-semibold">
                            İlk atamayı ekle →
                        </button>
                    )}
                </div>
            ) : (
                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead>
                                <tr className="bg-red-700 text-white">
                                    {COLS.map(col => (
                                        <th key={col.key} className={`${col.width} px-3 py-3 text-left font-black tracking-wider whitespace-nowrap border-r border-red-600 last:border-r-0`}>
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="w-24 px-3 py-3 text-center font-black tracking-wider">İŞLEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((a, i) => {
                                    const vals: Record<string, any> = {
                                        tarih: formatDate(a.tarih),
                                        saat: a.saat,
                                        salon: a.salon,
                                        aTeam: a.aTeam,
                                        bTeam: a.bTeam,
                                        kategori: a.kategori,
                                        hakem1: a.hakem1,
                                        hakem2: a.hakem2,
                                    };
                                    return (
                                        <tr
                                            key={a.id}
                                            onClick={() => setSelectedMatch(a)}
                                            className={`${i % 2 === 0 ? "bg-white dark:bg-zinc-900" : "bg-zinc-50 dark:bg-zinc-800/50"} hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 cursor-pointer`}
                                        >
                                            {COLS.map(col => (
                                                <td key={col.key} className="px-3 py-2.5 text-zinc-700 dark:text-zinc-300 border-r border-zinc-100 dark:border-zinc-800 max-w-[160px] truncate whitespace-nowrap" title={String(vals[col.key] || "")}>
                                                    {vals[col.key] || <span className="text-zinc-300 dark:text-zinc-600">—</span>}
                                                </td>
                                            ))}
                                            <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                                                <div className="flex items-center gap-1 justify-center">
                                                    <button onClick={() => setSelectedMatch(a)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors" title="Detay">
                                                        <Eye className="w-3.5 h-3.5 text-zinc-400 hover:text-blue-600" />
                                                    </button>
                                                    <button onClick={() => openEdit(a)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors" title="Düzenle">
                                                        <Pencil className="w-3.5 h-3.5 text-zinc-500 hover:text-blue-600" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirmId(a.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Sil">
                                                        <Trash2 className="w-3.5 h-3.5 text-zinc-400 hover:text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-400">
                        {filtered.length} maç gösteriliyor — Detay için satıra tıklayın
                    </div>
                </div>
            )}

            {/* ===== Match Detail Modal ===== */}
            {selectedMatch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-700 my-8">
                        {/* Header */}
                        <div className="flex items-start justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-[#DAEEF3]/30 dark:bg-[#DAEEF3]/5 rounded-t-2xl">
                            <div>
                                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Maç Detayı</p>
                                <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                                    {selectedMatch.aTeam} <span className="text-zinc-400 font-normal text-base">vs</span> {selectedMatch.bTeam}
                                </h2>
                                <p className="text-sm text-zinc-500 mt-0.5">
                                    {formatDate(selectedMatch.tarih)} {selectedMatch.saat && `· ${selectedMatch.saat}`} {selectedMatch.salon && `· ${selectedMatch.salon}`}
                                </p>
                            </div>
                            <button onClick={() => setSelectedMatch(null)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors mt-0.5">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Maç Bilgileri */}
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-zinc-100 dark:border-zinc-800">Maç Bilgileri</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <DetailRow label="Tarih" value={formatDate(selectedMatch.tarih)} />
                                    <DetailRow label="Saat" value={selectedMatch.saat} />
                                    <DetailRow label="Salon / Mekan" value={selectedMatch.salon} />
                                    <DetailRow label="Lig Türü" value={selectedMatch.ligTuru} />
                                    <DetailRow label="Hafta" value={selectedMatch.hafta ? `${selectedMatch.hafta}. Hafta` : null} />
                                    <DetailRow label="Kategori" value={selectedMatch.kategori} />
                                    <DetailRow label="Grup" value={selectedMatch.grup} />
                                    <DetailRow label="Sezon" value={getSezonFromDate(selectedMatch.tarih)} />
                                </div>
                            </div>

                            {/* Hakemler */}
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-zinc-100 dark:border-zinc-800">Hakemler</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailRow label="I. Hakem" value={selectedMatch.hakem1} />
                                    <DetailRow label="II. Hakem" value={selectedMatch.hakem2} />
                                </div>
                            </div>

                            {/* Masa Görevlileri */}
                            {(selectedMatch.sayiGorevlisi || selectedMatch.saatGorevlisi || selectedMatch.sutSaatiGorevlisi) && (
                                <div>
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-zinc-100 dark:border-zinc-800">Masa Görevlileri</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <DetailRow label="Sayı Görevlisi" value={selectedMatch.sayiGorevlisi} />
                                        <DetailRow label="Saat Görevlisi" value={selectedMatch.saatGorevlisi} />
                                        <DetailRow label="Şut Saati Görevlisi" value={selectedMatch.sutSaatiGorevlisi} />
                                    </div>
                                </div>
                            )}

                            {/* Diğer Görevliler */}
                            {(selectedMatch.gozlemci || selectedMatch.sahaKomiseri || selectedMatch.saglikci || selectedMatch.istatistikci1 || selectedMatch.istatistikci2) && (
                                <div>
                                    <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 pb-1 border-b border-zinc-100 dark:border-zinc-800">Diğer Görevliler</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <DetailRow label="Gözlemci / Temsilci" value={selectedMatch.gozlemci} />
                                        <DetailRow label="Saha Komiseri" value={selectedMatch.sahaKomiseri} />
                                        <DetailRow label="Sağlıkçı" value={selectedMatch.saglikci} />
                                        <DetailRow label="İstatistikçi 1" value={selectedMatch.istatistikci1} />
                                        <DetailRow label="İstatistikçi 2" value={selectedMatch.istatistikci2} />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
                            <button onClick={() => { setSelectedMatch(null); openEdit(selectedMatch); }}
                                className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-semibold transition-colors">
                                <Pencil className="w-3.5 h-3.5" /> Düzenle
                            </button>
                            <button onClick={() => setSelectedMatch(null)}
                                className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Import Modal (Local Archive) ===== */}
            {importModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Arşivden Aktar</h3>
                            <button onClick={() => setImportModalOpen(false)} disabled={importLoading} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>

                        {importResult ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                                    <CheckCircle2 className="w-5 h-5" />
                                    İçe aktarma tamamlandı
                                </div>
                                {importResult.firstTime && (
                                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        İlk aktarım tamamlandı — Sonraki seferlerde sadece eksik kayıtlar eklenir.
                                    </div>
                                )}
                                {importResult.seasons && importResult.seasons.length > 0 && (
                                    <p className="text-xs text-zinc-500">Taranan sezonlar: <strong>{importResult.seasons.join(", ")}</strong></p>
                                )}
                                <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl p-4 space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-zinc-500">Toplam bulunan:</span><span className="font-bold">{importResult.total}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Yeni eklenen:</span><span className="font-bold text-emerald-600">{importResult.imported}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Güncellenen:</span><span className="font-bold text-blue-600">{importResult.updated}</span></div>
                                    <div className="flex justify-between"><span className="text-zinc-500">Atlanan:</span><span className="font-bold text-zinc-400">{importResult.skipped}</span></div>
                                </div>
                                {importResult.errors.length > 0 && (
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 space-y-1">
                                        <div className="flex items-center gap-1 text-red-600 text-xs font-bold mb-1">
                                            <AlertCircle className="w-3.5 h-3.5" /> {importResult.errors.length} dosya hatası
                                        </div>
                                        {importResult.errors.slice(0, 5).map((e, i) => (
                                            <p key={i} className="text-xs text-red-500 truncate">{e}</p>
                                        ))}
                                    </div>
                                )}
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setImportModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        Kapat
                                    </button>
                                    <button onClick={() => { handleSezonChange(filterSezon); router.refresh(); setImportModalOpen(false); }}
                                        className="flex-1 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors">
                                        Listeyi Yenile
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-zinc-500 text-sm mb-1">
                                    <strong>İlk çalıştırmada:</strong> 2021-2022'den 2024-2025'e kadar tüm sezonları yerel arşiv dosyalarından aktarır.
                                </p>
                                <p className="text-zinc-400 text-xs mb-4">
                                    Sonraki çalıştırmalarda zaten aktarılmış kayıtlar atlanır. Sadece eksik kayıtlar eklenir.
                                </p>

                                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors mb-4">
                                    <input type="checkbox" checked={replaceExisting} onChange={e => setReplaceExisting(e.target.checked)}
                                        className="w-4 h-4 accent-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-white">Mevcut kayıtları güncelle</p>
                                        <p className="text-xs text-zinc-400">Aynı maç varsa üzerine yaz</p>
                                    </div>
                                </label>

                                <div className="flex gap-3">
                                    <button onClick={() => setImportModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                        Vazgeç
                                    </button>
                                    <button
                                        disabled={importLoading}
                                        onClick={async () => {
                                            setImportLoading(true);
                                            try {
                                                const res = await fetch("/api/atamalar/import-local", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ replaceExisting }),
                                                });
                                                const data = await res.json();
                                                if (data.success) setImportResult(data);
                                                else setImportResult({ imported: 0, updated: 0, skipped: 0, total: 0, errors: [data.error || "Hata"] });
                                            } catch (e: any) {
                                                setImportResult({ imported: 0, updated: 0, skipped: 0, total: 0, errors: [e.message] });
                                            } finally {
                                                setImportLoading(false);
                                            }
                                        }}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60"
                                    >
                                        {importLoading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Aktarılıyor...</> : <><RefreshCw className="w-4 h-4" /> Başlat</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ===== Export Modal ===== */}
            {exportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Excel İndir</h3>
                            <button onClick={() => setExportModalOpen(false)} className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                <X className="w-4 h-4 text-zinc-500" />
                            </button>
                        </div>
                        <p className="text-zinc-500 text-sm mb-4">
                            <strong>{filterSezon}</strong> sezonu — Lig türü seçin:
                        </p>
                        <div className="flex flex-col gap-2">
                            {["", ...LIG_TURU_OPTIONS].map(l => (
                                <button
                                    key={l || "tumu"}
                                    onClick={() => setExportLig(l)}
                                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all text-left ${exportLig === l ? "bg-red-700 text-white border-red-700" : "bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-red-400"}`}
                                >
                                    {l || "Tüm Kategoriler"}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setExportModalOpen(false)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                Vazgeç
                            </button>
                            <a
                                href={`/admin/atamalar/export?sezon=${encodeURIComponent(filterSezon)}${exportLig ? `&ligTuru=${encodeURIComponent(exportLig)}` : ""}${filterHafta && exportLig === "Yerel Ligler" ? `&hafta=${filterHafta}` : ""}`}
                                onClick={() => setExportModalOpen(false)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                İndir
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Delete Confirm Modal ===== */}
            {deleteConfirmId !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Atamayı Sil</h3>
                        <p className="text-zinc-500 text-sm mb-6">Bu atama kaydı silinecek. Bu işlem geri alınamaz.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 px-4 py-2 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                Vazgeç
                            </button>
                            <button onClick={() => handleDelete(deleteConfirmId)} disabled={isPending} className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                                {isPending ? "Siliniyor..." : "Sil"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== Create / Edit Modal ===== */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-4xl my-8 border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                {editingId !== null ? "Atamayı Düzenle" : "Yeni Atama Ekle"}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                                <X className="w-5 h-5 text-zinc-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* --- Üst Kategori --- */}
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Üst Kategori</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wide">Lig Türü</label>
                                        <select
                                            value={form.ligTuru}
                                            onChange={e => {
                                                setField("ligTuru", e.target.value);
                                                if (e.target.value !== "Yerel Ligler") setField("hafta", "");
                                            }}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-red-500"
                                        >
                                            <option value="">— Seçiniz —</option>
                                            {LIG_TURU_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                                        </select>
                                    </div>
                                    {isYerelLigler && (
                                        <div>
                                            <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wide">Hafta</label>
                                            <select
                                                value={form.hafta}
                                                onChange={e => setField("hafta", e.target.value)}
                                                className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-red-500"
                                            >
                                                <option value="">— Hafta Seçin —</option>
                                                {haftaOptions.map(h => (
                                                    <option key={h.name} value={h.name}>{h.label}</option>
                                                ))}
                                            </select>
                                            {form.hafta && (
                                                <p className="mt-1 text-xs text-zinc-400">
                                                    {form.hafta}. Hafta: {getWeekLabel(parseInt(form.hafta))}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* --- Maç Bilgileri --- */}
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Maç Bilgileri</div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wide">Tarih</label>
                                        <input type="date" value={form.tarih} onChange={e => setField("tarih", e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-red-500" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-500 mb-1 uppercase tracking-wide">Saat</label>
                                        <input type="time" value={form.saat} onChange={e => setField("saat", e.target.value)}
                                            className="w-full px-3 py-2 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white focus:outline-none focus:border-red-500" />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <SearchableSelect label="Salon / Mekan" value={form.salon} onChange={v => setField("salon", v)} options={salonOptions} placeholder="— Salon Seçin —" />
                                        <input type="text" value={form.salon} onChange={e => setField("salon", e.target.value)} placeholder="veya yazın..."
                                            className="mt-1 w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-red-400 placeholder:text-zinc-400" />
                                    </div>
                                    <div>
                                        <SearchableSelect label="A Takımı" value={form.aTeam} onChange={v => setField("aTeam", v)} options={teamOptions} placeholder="— A Takımı —" />
                                        <input type="text" value={form.aTeam} onChange={e => setField("aTeam", e.target.value)} placeholder="veya yazın..."
                                            className="mt-1 w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-red-400 placeholder:text-zinc-400" />
                                    </div>
                                    <div>
                                        <SearchableSelect label="B Takımı" value={form.bTeam} onChange={v => setField("bTeam", v)} options={teamOptions} placeholder="— B Takımı —" />
                                        <input type="text" value={form.bTeam} onChange={e => setField("bTeam", e.target.value)} placeholder="veya yazın..."
                                            className="mt-1 w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-red-400 placeholder:text-zinc-400" />
                                    </div>
                                    <div>
                                        <SearchableSelect label="Kategori" value={form.kategori} onChange={v => setField("kategori", v)} options={categoryOptions} placeholder="— Kategori Seçin —" />
                                        <input type="text" value={form.kategori} onChange={e => setField("kategori", e.target.value)} placeholder="veya yazın..."
                                            className="mt-1 w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-red-400 placeholder:text-zinc-400" />
                                    </div>
                                    <div>
                                        <SearchableSelect label="Grup" value={form.grup} onChange={v => setField("grup", v)} options={groupOptions} placeholder="— Grup Seçin —" />
                                        <input type="text" value={form.grup} onChange={e => setField("grup", e.target.value)} placeholder="veya yazın..."
                                            className="mt-1 w-full px-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-red-400 placeholder:text-zinc-400" />
                                    </div>
                                </div>
                            </div>

                            {/* --- Görevliler --- */}
                            <div>
                                <div className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3">Görevliler</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <SearchableSelect label="1. Hakem" value={form.hakem1} onChange={v => setField("hakem1", v)} options={referees} placeholder="— 1. Hakem —" />
                                        {form.hakem1 && form.hakem2 && form.hakem1 === form.hakem2 && (
                                            <p className="mt-1 text-xs text-red-500">1. ve 2. Hakem aynı olamaz</p>
                                        )}
                                    </div>
                                    <SearchableSelect label="2. Hakem" value={form.hakem2} onChange={v => setField("hakem2", v)} options={referees.filter(r => r.name !== form.hakem1)} placeholder="— 2. Hakem —" />
                                    <SearchableSelect label="Sayı Görevlisi" value={form.sayiGorevlisi} onChange={v => setField("sayiGorevlisi", v)} options={tableOfficials} placeholder="— Sayı Görevlisi —" />
                                    <SearchableSelect label="Saat Görevlisi" value={form.saatGorevlisi} onChange={v => setField("saatGorevlisi", v)} options={tableOfficials} placeholder="— Saat Görevlisi —" />
                                    <SearchableSelect label="Şut Saati Görevlisi" value={form.sutSaatiGorevlisi} onChange={v => setField("sutSaatiGorevlisi", v)} options={tableOfficials} placeholder="— Şut Saati Görevlisi —" />
                                    <SearchableSelect label="Gözlemci" value={form.gozlemci} onChange={v => setField("gozlemci", v)} options={observers} placeholder="— Gözlemci —" />
                                    <SearchableSelect label="Saha Komiseri" value={form.sahaKomiseri} onChange={v => setField("sahaKomiseri", v)} options={fieldCommissioners} placeholder="— Saha Komiseri —" />
                                    <SearchableSelect label="Sağlıkçı" value={form.saglikci} onChange={v => setField("saglikci", v)} options={healthOfficials} placeholder="— Sağlıkçı —" />
                                    <SearchableSelect label="İstatistikçi 1" value={form.istatistikci1} onChange={v => setField("istatistikci1", v)} options={statisticians} placeholder="— İstatistikçi 1 —" />
                                    <SearchableSelect label="İstatistikçi 2" value={form.istatistikci2} onChange={v => setField("istatistikci2", v)} options={statisticians} placeholder="— İstatistikçi 2 —" />
                                </div>
                            </div>

                            {error && (
                                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-300">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300">
                                    Vazgeç
                                </button>
                                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2.5 bg-red-700 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-md">
                                    {isPending ? "Kaydediliyor..." : editingId !== null ? "Güncelle" : "Atama Ekle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
