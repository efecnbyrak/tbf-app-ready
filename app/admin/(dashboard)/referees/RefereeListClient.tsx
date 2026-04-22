"use client";

import { useState, useTransition } from "react";
import { Search, MapPin, ChevronRight, UserX, UserCheck, ShieldCheck, ShieldAlert, Loader2, Users, ClipboardList, Briefcase, Trophy, Download, X, CheckSquare, Square, FileSpreadsheet } from "lucide-react";
import { OfficialRow } from "@/components/admin/OfficialRow";
import { ProfileDetailModal } from "@/components/admin/ProfileDetailModal";
import { getIstanbulSide } from "@/lib/region-utils";
import { toggleUserActiveStatus, promoteToAdmin, demoteFromAdmin } from "@/app/actions/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";

interface RefereeListClientProps {
    initialReferees: any[];
    refereeTypeMap: Record<string, string>;
    currentUserRole?: string | null;
    currentUserEmail?: string | null;
}

const CLASSIFICATION_MAP: Record<string, string> = {
    "MANAGERS": "Yöneticiler",
    "UNAPPROVED": "Onay Bekleyenler",
    "A": "A Klasmanı",
    "B": "B Klasmanı",
    "C": "C Klasmanı",
    "IL_HAKEMI": "İl Hakemi",
    "ADAY_HAKEM": "Aday Hakem",
    "BELIRLENMEMIS": "Belirtilmemiş",
};

const ORDERED_CLASSIFICATIONS = [
    "MANAGERS",
    "UNAPPROVED",
    "A",
    "B",
    "C",
    "IL_HAKEMI",
    "ADAY_HAKEM",
    "BELIRLENMEMIS"
];

// Aesthetic config for top category buttons
const CATEGORY_ICONS: Record<string, any> = {
    "ALL": { icon: Users, color: "text-zinc-600", bg: "bg-zinc-50 dark:bg-zinc-900/40", border: "border-zinc-200 dark:border-zinc-800" },
    "MANAGERS": { icon: ShieldCheck, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20", border: "border-indigo-100 dark:border-indigo-800" },
    "UNAPPROVED": { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-100 dark:border-red-800" },
    "A": { icon: Trophy, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-100 dark:border-amber-800" },
    "B": { icon: Trophy, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-800" },
    "C": { icon: Trophy, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-100 dark:border-emerald-800" },
    "IL_HAKEMI": { icon: Briefcase, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", border: "border-purple-100 dark:border-purple-800" },
    "ADAY_HAKEM": { icon: Briefcase, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-100 dark:border-orange-800" },
};

export function RefereeListClient({ initialReferees, refereeTypeMap, currentUserRole, currentUserEmail }: RefereeListClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSide, setSelectedSide] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>("ALL");
    const [selectedOfficial, setSelectedOfficial] = useState<any>(null);
    const [isPending, startTransition] = useTransition();

    // Export modal state
    const [exportModalOpen, setExportModalOpen] = useState(false);
    const [exportingExcel, setExportingExcel] = useState(false);
    const EXPORT_FIELDS = [
        { key: "name", label: "İsim Soyisim" },
        { key: "iban", label: "IBAN No" },
        { key: "email", label: "Mail Adresi" },
        { key: "classification", label: "Klasman Bilgisi" },
        { key: "address", label: "Adres" },
        { key: "phone", label: "Telefon Numarası" },
    ];
    const [selectedExportFields, setSelectedExportFields] = useState<string[]>(["name"]);
    const [exportCategory, setExportCategory] = useState<string>("ALL");

    const toggleExportField = (key: string) => {
        setSelectedExportFields(prev =>
            prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
        );
    };

    const handleExportExcel = async () => {
        if (selectedExportFields.length === 0) return;
        setExportingExcel(true);
        try {
            const ExcelJS = await import("exceljs");
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet("Hakemler");

            const cols: any[] = [];
            if (selectedExportFields.includes("name")) cols.push({ header: "İsim Soyisim", key: "name", width: 30 });
            if (selectedExportFields.includes("iban")) cols.push({ header: "IBAN No", key: "iban", width: 35 });
            if (selectedExportFields.includes("email")) cols.push({ header: "Mail Adresi", key: "email", width: 35 });
            if (selectedExportFields.includes("classification")) cols.push({ header: "Klasman", key: "classification", width: 20 });
            if (selectedExportFields.includes("address")) cols.push({ header: "Adres", key: "address", width: 50 });
            if (selectedExportFields.includes("phone")) cols.push({ header: "Telefon", key: "phone", width: 20 });
            sheet.columns = cols;

            sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
            sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };

            const classMap: Record<string, string> = {
                "A": "A Klasmanı", "B": "B Klasmanı", "C": "C Klasmanı",
                "IL_HAKEMI": "İl Hakemi", "ADAY_HAKEM": "Aday Hakem", "BELIRLENMEMIS": "Belirlenmemiş"
            };

            const refsToExport = exportCategory === "ALL" ? initialReferees : initialReferees.filter(ref => {
                if (exportCategory === "MANAGERS") return ref.user?.role?.name === "ADMIN";
                if (ref.user?.role?.name === "ADMIN") return false;
                if (exportCategory === "UNAPPROVED") return !ref.user?.isApproved;
                if (!ref.user?.isApproved) return false;
                if (exportCategory === "BELIRLENMEMIS") return !ref.classification || ref.classification === "" || ref.classification === "BELIRLENMEMIS";
                return ref.classification === exportCategory;
            });
            refsToExport.forEach((ref, i) => {
                const row: any = {};
                if (selectedExportFields.includes("name")) row.name = `${ref.firstName || ""} ${ref.lastName || ""}`.trim();
                if (selectedExportFields.includes("iban")) row.iban = ref.iban || "-";
                if (selectedExportFields.includes("email")) row.email = ref.email || "-";
                if (selectedExportFields.includes("classification")) row.classification = classMap[ref.classification] || ref.classification || "-";
                if (selectedExportFields.includes("address")) row.address = ref.address || "-";
                if (selectedExportFields.includes("phone")) row.phone = ref.phone || "-";
                const addedRow = sheet.addRow(row);
                if (i % 2 === 1) {
                    addedRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                }
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const catLabel = exportCategory === "ALL" ? "tum" : (CLASSIFICATION_MAP[exportCategory] || exportCategory).replace(/\s/g, "_").toLocaleLowerCase('tr');
            a.download = `hakemler_${catLabel}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
            setExportModalOpen(false);
        } catch (e) {
            console.error("Excel export error:", e);
            alert("Excel oluşturulurken bir hata oluştu.");
        } finally {
            setExportingExcel(false);
        }
    };
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Optimized Filter & Sort logic
    const filteredReferees = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return initialReferees.filter(ref => {
            const fullName = `${ref.firstName} ${ref.lastName}`.toLowerCase();
            const matchesQuery = fullName.includes(query);
            if (!matchesQuery) return false;

            if (selectedSide) {
                const sideFromRegions = ref.regions?.map((r: any) => getIstanbulSide(r.name)).find((s: any) => s !== null);
                const sideFromAddress = getIstanbulSide(ref.address);
                const finalSide = sideFromRegions || sideFromAddress;
                if (finalSide !== selectedSide) return false;
            }
            return true;
        }).sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB, 'tr');
        });
    }, [initialReferees, searchQuery, selectedSide]);

    // 2. Optimized Grouping
    const grouped = useMemo(() => {
        const result = {} as Record<string, any[]>;
        ORDERED_CLASSIFICATIONS.forEach(code => {
            const label = CLASSIFICATION_MAP[code];
            result[label] = filteredReferees.filter(ref => {
                if (code === "MANAGERS") return ref.user?.role?.name === "ADMIN";
                if (ref.user?.role?.name === "ADMIN") return false;
                if (code === "UNAPPROVED") return !ref.user?.isApproved;
                if (ref.user?.isApproved === false && code !== "UNAPPROVED") return false;
                if (code === "BELIRLENMEMIS") {
                    return !ref.classification || ref.classification === "" || ref.classification === "BELIRLENMEMIS" || !CLASSIFICATION_MAP[ref.classification];
                }
                return ref.classification === code;
            });
        });
        return result;
    }, [filteredReferees]);

    const handleToggleStatus = (id: number) => {
        if (!confirm("Kullanıcı durumunu değiştirmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
            const res = await toggleUserActiveStatus(id);
            if (res.error) alert(res.error);
            else {
                router.refresh();
                if (selectedOfficial?.user?.id === id) {
                    setSelectedOfficial({ ...selectedOfficial, user: { ...selectedOfficial.user, isActive: !selectedOfficial.user.isActive } });
                }
            }
        });
    };

    const handlePromote = (id: number) => {
        if (!confirm("Bu kullanıcıyı yönetici yapmak istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        startTransition(async () => {
            const res = await promoteToAdmin(id);
            if (res.error) alert(res.error);
            else {
                alert(res.message);
                router.refresh();
            }
        });
    };

    const handleDemote = (id: number) => {
        if (!confirm("Bu kullanıcının yöneticilik yetkisini almak istediğinize emin misiniz?")) return;
        startTransition(async () => {
            const res = await demoteFromAdmin(id);
            if (res.error) alert(res.error);
            else {
                alert(res.success ? "Yöneticilik yetkisi başarıyla geri alındı." : "Hata oluştu.");
                router.refresh();
            }
        });
    };

    return (
        <div className="space-y-8 pb-20 px-4 md:px-10 lg:px-14">
            {/* Header */}
            <div className="px-4 md:px-8 lg:px-12">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight uppercase italic underline decoration-red-600/30 underline-offset-8">
                        Hakem Yönetimi
                    </h1>
                </div>
                <p className="text-zinc-500 font-bold tracking-tight uppercase italic text-[10px] ml-13">Klasman bazlı gruplandırma ve gelişmiş arama sistemi.</p>
            </div>

            {/* Top Categories Filter */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-4 md:px-8 lg:px-12">
                <button
                    onClick={() => setActiveCategory("ALL")}
                    className={`group relative p-2.5 sm:p-3 md:p-4 lg:p-5 min-w-[100px] sm:min-w-[120px] rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${activeCategory === "ALL"
                        ? "bg-zinc-950 text-white border-zinc-950 shadow-2xl scale-[1.02] z-10"
                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-red-400/50 hover:shadow-lg"}`}
                >
                    <div className="flex flex-col items-center gap-1.5 md:gap-3">
                        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${activeCategory === "ALL" ? "bg-red-600 shadow-lg shadow-red-600/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                            <Users className={`w-4 h-4 md:w-6 h-6 ${activeCategory === "ALL" ? "text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-red-500"}`} />
                        </div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] italic text-zinc-900 dark:text-white text-center leading-[1.1]">TÜMÜ</span>
                    </div>
                </button>

                {ORDERED_CLASSIFICATIONS.map(code => {
                    if (code === "BELIRLENMEMIS") return null;
                    const label = CLASSIFICATION_MAP[code];
                    const cfg = CATEGORY_ICONS[code];
                    const isSelected = activeCategory === code;
                    const Icon = cfg.icon;

                    return (
                        <button
                            key={code}
                            onClick={() => setActiveCategory(code)}
                            className={`group relative p-2.5 sm:p-3 md:p-4 lg:p-5 min-w-[100px] sm:min-w-[120px] rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${isSelected
                                ? `${cfg.bg} ${cfg.border} shadow-2xl scale-[1.02] z-10`
                                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg"}`}
                        >
                            <div className="flex flex-col items-center gap-1.5 md:gap-3">
                                <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${isSelected ? "bg-white shadow-lg" : "bg-zinc-50 dark:bg-zinc-800 transition-colors border border-zinc-100 dark:border-transparent"}`}>
                                    <Icon className={`w-4 h-4 md:w-6 h-6 ${isSelected ? cfg.color : "text-zinc-500 dark:text-zinc-400 group-hover:text-red-500"}`} />
                                </div>
                                <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] italic text-center leading-[1.1] ${isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"}`}>
                                    {label}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Toolbar — mirrors Officials page structure */}
            <div className="flex flex-col gap-4 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 mx-4 md:mx-8 lg:mx-12">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase italic">
                            {activeCategory === "ALL" ? "TÜM HAKEMLER" : (CLASSIFICATION_MAP[activeCategory] || activeCategory).toUpperCase()}
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold tracking-tight uppercase italic">{filteredReferees.length} KAYIT BULUNDU</p>
                    </div>
                </div>

                {/* Side Filter */}
                <div className="flex overflow-x-auto bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl gap-1">
                    <button
                        type="button"
                        onClick={() => setSelectedSide(null)}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!selectedSide ? 'bg-white dark:bg-zinc-700 text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        TÜM YAKALAR
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedSide("Anadolu")}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSide === "Anadolu" ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        ANADOLU
                    </button>
                    <button
                        type="button"
                        onClick={() => setSelectedSide("Avrupa")}
                        className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedSide === "Avrupa" ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        AVRUPA
                    </button>
                </div>

                {/* Search + Veri Al */}
                <div className="flex items-center gap-3 w-full">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Hakemlerde ara (İsim)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-6 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-red-600 outline-none transition-all font-medium text-zinc-900 dark:text-white"
                        />
                    </div>
                    {currentUserRole === "SUPER_ADMIN" && (
                        <button
                            onClick={() => setExportModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Veri Al</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Summary */}
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
                {ORDERED_CLASSIFICATIONS.map(code => {
                    const label = CLASSIFICATION_MAP[code];
                    const count = grouped[label]?.length || 0;
                    if (count === 0 && code !== "MANAGERS") return null;
                    return (
                        <div
                            key={code}
                            className={`flex-shrink-0 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border-2 shadow-sm transition-all cursor-pointer ${activeCategory === code ? "border-red-600 ring-2 ring-red-600/10" : "border-zinc-50 dark:border-zinc-800 hover:border-zinc-200"}`}
                            onClick={() => setActiveCategory(code)}
                        >
                            <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</span>
                            <span className={`text-lg font-black italic ${activeCategory === code ? "text-red-600" : "text-zinc-900 dark:text-white"}`}>{count}</span>
                        </div>
                    )
                })}
            </div>

            {/* List Content */}
            <div className="space-y-16">
                {ORDERED_CLASSIFICATIONS.map(code => {
                    const label = CLASSIFICATION_MAP[code];
                    const groupReferees = grouped[label];

                    if (activeCategory !== "ALL" && activeCategory !== code) return null;
                    if (groupReferees.length === 0 && searchQuery !== "") return null;
                    if (groupReferees.length === 0 && code !== "BELIRLENMEMIS") return null;

                    return (
                        <section key={code} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8 px-2">
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                                    {label}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent" />
                                <span className="px-5 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-xl text-[10px] font-black tracking-[0.2em] uppercase">
                                    {groupReferees.length} ÖĞE
                                </span>
                            </div>

                            {groupReferees.length === 0 ? (
                                <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-950 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                    <p className="text-zinc-400 font-medium italic">Bu klasmanda henüz kayıt bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    {groupReferees.map((ref) => (
                                        <OfficialRow
                                            key={ref.id}
                                            official={{
                                                ...ref,
                                                officialType: refereeTypeMap[ref.id] || "REFEREE"
                                            }}
                                            isSuperAdmin={currentUserRole === "SUPER_ADMIN"}
                                            onClick={() => setSelectedOfficial({
                                                ...ref,
                                                officialType: refereeTypeMap[ref.id] || "REFEREE"
                                            })}
                                            onToggleActive={() => handleToggleStatus(ref.user?.id)}
                                            onPromote={(currentUserRole === "SUPER_ADMIN" || currentUserEmail === "talatmustafaozdemir@gmail.com") ? () => handlePromote(ref.user?.id) : undefined}
                                            onDemote={(currentUserRole === "SUPER_ADMIN" || currentUserEmail === "talatmustafaozdemir@gmail.com") ? () => handleDemote(ref.user?.id) : undefined}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })}

                {filteredReferees.length === 0 && (
                    <div className="py-24 text-center">
                        <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShieldAlert className="w-10 h-10 text-zinc-400" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tighter">SONUÇ BULUNAMADI</h3>
                        <p className="text-zinc-500 font-medium italic">"{searchQuery}" aramasıyla eşleşen bir kayıt yok.</p>
                    </div>
                )}
            </div>

            {/* Profile Modal */}
            {selectedOfficial && (
                <ProfileDetailModal
                    official={selectedOfficial}
                    isSuperAdmin={currentUserRole === "SUPER_ADMIN"}
                    currentUserEmail={currentUserEmail}
                    onClose={() => setSelectedOfficial(null)}
                    onToggleActive={() => handleToggleStatus(selectedOfficial.user?.id)}
                    onPromote={() => handlePromote(selectedOfficial.user?.id)}
                    onDemote={() => handleDemote(selectedOfficial.user?.id)}
                />
            )}

            {/* Export Modal */}
            {exportModalOpen && (
                <div
                    className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setExportModalOpen(false)}
                >
                    <div
                        className="relative bg-white dark:bg-zinc-900 rounded-[2rem] w-full max-w-md shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button on modal container */}
                        <button
                            type="button"
                            onClick={() => setExportModalOpen(false)}
                            className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                        {/* Modal Header */}
                        <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                    <FileSpreadsheet className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black uppercase italic tracking-tight">Hakem Verisi Al</h2>
                                    <p className="text-emerald-100 text-xs">
                                        {exportCategory === "ALL" ? initialReferees.length : initialReferees.filter(ref => {
                                            if (exportCategory === "MANAGERS") return ref.user?.role?.name === "ADMIN";
                                            if (ref.user?.role?.name === "ADMIN") return false;
                                            if (exportCategory === "UNAPPROVED") return !ref.user?.isApproved;
                                            if (!ref.user?.isApproved) return false;
                                            if (exportCategory === "BELIRLENMEMIS") return !ref.classification || ref.classification === "" || ref.classification === "BELIRLENMEMIS";
                                            return ref.classification === exportCategory;
                                        }).length} hakem • İndirmek istediğiniz alanları seçin
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Category Selection */}
                        <div className="px-6 pt-6 space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">Klasman Filtresi</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setExportCategory("ALL")}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${exportCategory === "ALL" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"}`}
                                >
                                    TÜMÜ
                                </button>
                                {ORDERED_CLASSIFICATIONS.map(code => (
                                    <button
                                        key={code}
                                        onClick={() => setExportCategory(code)}
                                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${exportCategory === code ? "bg-emerald-600 border-emerald-600 text-white" : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"}`}
                                    >
                                        {CLASSIFICATION_MAP[code]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Field Selection */}
                        <div className="p-6 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Alan Seçimi</p>
                            {EXPORT_FIELDS.map(field => (
                                <button
                                    key={field.key}
                                    onClick={() => toggleExportField(field.key)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                                        selectedExportFields.includes(field.key)
                                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                                            : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                                    }`}
                                >
                                    {selectedExportFields.includes(field.key)
                                        ? <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0" />
                                        : <Square className="w-5 h-5 text-zinc-400 shrink-0" />
                                    }
                                    <span className={`font-bold text-sm ${selectedExportFields.includes(field.key) ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                                        {field.label}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setExportModalOpen(false)}
                                className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-black rounded-xl text-sm uppercase tracking-wider transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleExportExcel}
                                disabled={selectedExportFields.length === 0 || exportingExcel}
                                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                            >
                                {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                {exportingExcel ? "İndiriliyor..." : "Excel İndir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Loading Overlay */}
            {isPending && (
                <div className="fixed inset-0 z-[110] bg-zinc-950/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">İşlem Yapılıyor...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
