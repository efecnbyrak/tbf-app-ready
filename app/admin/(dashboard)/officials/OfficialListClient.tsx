"use client";

import { useState, useTransition, useMemo } from "react";
import { Search, Users, ShieldAlert, Loader2, Table, Shield, Activity, FileSpreadsheet, Briefcase } from "lucide-react";
import { OfficialRow } from "@/components/admin/OfficialRow";
import { ProfileDetailModal } from "@/components/admin/ProfileDetailModal";
import { getIstanbulSide } from "@/lib/region-utils";
import { toggleUserActiveStatus, promoteToAdmin, demoteFromAdmin } from "@/app/actions/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

interface OfficialListClientProps {
    initialOfficials: any[];
    refereeTypeMap: Record<string, string>;
    currentUserRole?: string | null;
    currentUserEmail?: string | null;
    selectedType?: string;
    selectedStatus?: string;
}

const TYPES = [
    { id: "TABLE", label: "Masa Görevlileri", icon: Table, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", borderColor: "border-orange-200 dark:border-orange-800" },
    { id: "OBSERVER", label: "Gözlemciler", icon: Shield, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
    { id: "STATISTICIAN", label: "İstatistik Görevlileri", icon: FileSpreadsheet, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-200 dark:border-purple-800" },
    { id: "HEALTH", label: "Sağlık Görevlileri", icon: Activity, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800" },
    { id: "FIELD_COMMISSIONER", label: "Saha Komiserleri", icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800" },
    { id: "TABLE_STATISTICIAN", label: "Masa & İstatistik", icon: Table, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20", borderColor: "border-rose-200 dark:border-rose-800" },
    { id: "TABLE_HEALTH", label: "Masa & Sağlık", icon: Activity, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-900/20", borderColor: "border-cyan-200 dark:border-cyan-800" },
];

export function OfficialListClient({ initialOfficials, refereeTypeMap, currentUserRole, currentUserEmail }: OfficialListClientProps) {
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSide, setSelectedSide] = useState<string | null>(null); // "Anadolu" | "Avrupa" | null
    const [selectedOfficial, setSelectedOfficial] = useState<any>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const filtered = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return initialOfficials.filter(off => {
            // 1. Search Query
            const fullName = `${off.firstName} ${off.lastName}`.toLowerCase();
            const tckn = (off.tckn || "").toLowerCase();
            const matchesQuery = fullName.includes(query) || tckn.includes(query);
            if (!matchesQuery) return false;

            // 2. Category / Type Filtering
            if (selectedStatus === "unapproved") {
                if (off.user?.isApproved) return false;
            } else if (selectedStatus === "managers") {
                if (off.user?.role?.name !== "ADMIN") return false;
            } else if (selectedType !== "ALL") {
                const type = refereeTypeMap[off.id];
                if (type !== selectedType) return false;
            }

            // 3. Side Filtering
            if (selectedSide) {
                const sideFromRegions = off.regions?.map((r: any) => getIstanbulSide(r.name)).find((s: any) => s !== null);
                const sideFromAddress = getIstanbulSide(off.address);
                const finalSide = sideFromRegions || sideFromAddress;
                if (finalSide !== selectedSide) return false;
            }
            return true;
        }).sort((a, b) => {
            const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
            const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
            return nameA.localeCompare(nameB, 'tr');
        });
    }, [initialOfficials, searchQuery, selectedSide, selectedType, selectedStatus, refereeTypeMap]);

    // Helper to switch category
    const switchCategory = (type: string, status: string | null = null) => {
        setSelectedType(type);
        setSelectedStatus(status);
    };

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
        if (!confirm("Seçilen Gözlemciyi yönetici yapmak istediğinize emin misiniz?")) return;
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
            {/* Header / Navigation Folders */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3">
                <button
                    onClick={() => switchCategory("ALL", null)}
                    className={`group relative p-2.5 sm:p-3 md:p-4 lg:p-5 min-w-[100px] sm:min-w-[120px] rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${(!selectedStatus && selectedType === "ALL")
                        ? "bg-zinc-950 text-white border-zinc-950 shadow-2xl scale-[1.02] z-10"
                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-red-400/50 hover:shadow-lg"}`}
                >
                    <div className="flex flex-col items-center gap-1.5 md:gap-3">
                        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${(!selectedStatus && selectedType === "ALL") ? "bg-red-600 shadow-lg shadow-red-600/30" : "bg-zinc-100 dark:bg-zinc-800"}`}>
                            <Users className={`w-4 h-4 md:w-6 h-6 ${(!selectedStatus && selectedType === "ALL") ? "text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-red-500"}`} />
                        </div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] italic text-zinc-900 dark:text-white text-center leading-[1.1]">TÜMÜ</span>
                    </div>
                </button>

                <button
                    onClick={() => switchCategory("ALL", "unapproved")}
                    className={`group relative p-2.5 sm:p-3 md:p-4 lg:p-5 min-w-[100px] sm:min-w-[120px] rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${selectedStatus === "unapproved"
                        ? "bg-red-600 text-white border-red-600 shadow-2xl scale-[1.02] z-10"
                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-red-400/50 hover:shadow-lg"}`}
                >
                    <div className="flex flex-col items-center gap-1.5 md:gap-3">
                        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${selectedStatus === "unapproved" ? "bg-white shadow-lg" : "bg-red-50 dark:bg-red-900/20"}`}>
                            <ShieldAlert className={`w-4 h-4 md:w-6 h-6 ${selectedStatus === "unapproved" ? "text-red-600" : "text-red-500"}`} />
                        </div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] italic text-center leading-[1.1] text-zinc-900 dark:text-white">ONAY BEKLEYEN</span>
                    </div>
                </button>

                <button
                    onClick={() => switchCategory("ALL", "managers")}
                    className={`group relative p-2.5 sm:p-3 md:p-4 lg:p-5 min-w-[100px] sm:min-w-[120px] rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${selectedStatus === "managers"
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xl scale-[1.02] z-10"
                        : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-indigo-400/50 hover:shadow-lg"}`}
                >
                    <div className="flex flex-col items-center gap-1.5 md:gap-3">
                        <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${selectedStatus === "managers" ? "bg-white shadow-lg" : "bg-indigo-50 dark:bg-indigo-900/20"}`}>
                            <Shield className={`w-4 h-4 md:w-6 h-6 ${selectedStatus === "managers" ? "text-indigo-600" : "text-indigo-500"}`} />
                        </div>
                        <span className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] italic text-center leading-[1.1] text-zinc-900 dark:text-white">YÖNETİCİLER</span>
                    </div>
                </button>

                {TYPES.map((t) => {
                    const isSelected = selectedType === t.id && !selectedStatus;
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => switchCategory(t.id, null)}
                            className={`group relative p-2.5 sm:p-3 md:p-4 lg:p-5 min-w-[100px] sm:min-w-[120px] rounded-2xl md:rounded-[2rem] border-2 transition-all duration-300 ${isSelected
                                ? `${t.bg} ${t.borderColor} shadow-2xl scale-[1.02] z-10`
                                : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-lg"}`}
                        >
                            <div className="flex flex-col items-center gap-1.5 md:gap-3">
                                <div className={`p-2 md:p-3 rounded-xl md:rounded-2xl ${isSelected ? "bg-white shadow-lg" : "bg-zinc-50 dark:bg-zinc-800 transition-colors border border-zinc-100 dark:border-transparent"}`}>
                                    <Icon className={`w-4 h-4 md:w-6 h-6 ${isSelected ? t.color : "text-zinc-500 dark:text-zinc-400 group-hover:text-red-500"}`} />
                                </div>
                                <span className={`text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase tracking-tight md:tracking-[0.1em] italic text-center leading-[1.1] ${isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white"}`}>
                                    {t.label}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight uppercase italic">
                            {selectedStatus === "unapproved" ? "ONAY BEKLEYENLER" : (selectedType !== "ALL" ? TYPES.find(t => t.id === selectedType)?.label : "TÜM GÖREVLİLER")}
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold tracking-tight uppercase italic">{filtered.length} KAYIT BULUNDU</p>
                    </div>
                </div>

                {/* Sub-category Side Filter */}
                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl gap-1">
                    <button
                        onClick={() => setSelectedSide(null)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!selectedSide ? 'bg-white dark:bg-zinc-700 text-red-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        TÜM YAKALAR
                    </button>
                    <button
                        onClick={() => setSelectedSide("Anadolu")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSide === "Anadolu" ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        ANADOLU
                    </button>
                    <button
                        onClick={() => setSelectedSide("Avrupa")}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedSide === "Avrupa" ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                    >
                        AVRUPA
                    </button>
                </div>

                <div className="relative flex-1 max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="İsim veya TCKN ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-zinc-50 dark:bg-zinc-950 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl focus:border-red-600 outline-none transition-all font-medium text-zinc-900 dark:text-white"
                    />
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-20 text-center border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                        <Users className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                        <p className="text-zinc-400 font-black uppercase tracking-widest italic">Kayıt Bulunamadı</p>
                    </div>
                ) : (
                    filtered.map((off: any) => (
                        <OfficialRow
                            key={off.id}
                            official={{
                                ...off,
                                officialType: refereeTypeMap[off.id] || "REFEREE"
                            }}
                            isSuperAdmin={currentUserRole === "SUPER_ADMIN"}
                            onClick={() => setSelectedOfficial({
                                ...off,
                                officialType: refereeTypeMap[off.id] || "REFEREE"
                            })}
                            onToggleActive={() => handleToggleStatus(off.user?.id)}
                            onPromote={(currentUserRole === "SUPER_ADMIN" || currentUserEmail === "talatmustafaozdemir@gmail.com") ? () => handlePromote(off.user?.id) : undefined}
                            onDemote={(currentUserRole === "SUPER_ADMIN" || currentUserEmail === "talatmustafaozdemir@gmail.com") ? () => handleDemote(off.user?.id) : undefined}
                        />
                    ))
                )}
            </div>

            {/* Modals & Overlays */}
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

            {isPending && (
                <div className="fixed inset-0 z-[110] bg-zinc-950/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">GÜNCELLENİYOR...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
