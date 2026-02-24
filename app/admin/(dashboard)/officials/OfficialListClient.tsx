"use client";

import { useState, useTransition } from "react";
import { Search, Users, ShieldAlert, Loader2, Table, Shield, Activity, FileSpreadsheet, Briefcase } from "lucide-react";
import { OfficialRow } from "@/components/admin/OfficialRow";
import { ProfileDetailModal } from "@/components/admin/ProfileDetailModal";
import { toggleUserActiveStatus, promoteToAdmin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface OfficialListClientProps {
    initialOfficials: any[];
    refereeTypeMap: Record<string, string>;
    currentUserRole?: string | null;
    selectedType?: string;
    selectedStatus?: string;
}

const TYPES = [
    { id: "TABLE", label: "Masa Görevlileri", icon: Table, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", borderColor: "border-orange-200 dark:border-orange-800" },
    { id: "OBSERVER", label: "Gözlemciler", icon: Shield, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
    { id: "STATISTICIAN", label: "İstatistik Görevlileri", icon: FileSpreadsheet, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-200 dark:border-purple-800" },
    { id: "HEALTH", label: "Sağlık Görevlileri", icon: Activity, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800" },
    { id: "FIELD_COMMISSIONER", label: "Saha Komiserleri", icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20", borderColor: "border-amber-200 dark:border-amber-800" },
];

export function OfficialListClient({ initialOfficials, refereeTypeMap, currentUserRole, selectedType, selectedStatus }: OfficialListClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOfficial, setSelectedOfficial] = useState<any>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const filtered = initialOfficials.filter(off => {
        const fullName = `${off.firstName} ${off.lastName}`.toLowerCase();
        const tckn = off.tckn.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || tckn.includes(query);
    });

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

    return (
        <div className="space-y-8 pb-20">
            {/* Header / Navigation Folders */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                <Link
                    href="/admin/officials"
                    className={`group p-4 rounded-3xl border transition-all ${(!selectedType && !selectedStatus)
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-xl scale-105"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200"}`}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Users className={`w-7 h-7 ${(!selectedType && !selectedStatus) ? "text-white" : "text-zinc-400 group-hover:text-red-500"}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic">TÜMÜ</span>
                    </div>
                </Link>

                <Link
                    href="/admin/officials?status=unapproved"
                    className={`group p-4 rounded-3xl border transition-all ${selectedStatus === "unapproved"
                        ? "bg-red-600 text-white border-red-600 shadow-xl scale-105"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200"}`}
                >
                    <div className="flex flex-col items-center gap-2">
                        <ShieldAlert className={`w-7 h-7 ${selectedStatus === "unapproved" ? "text-white" : "text-red-500"}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest italic text-center">ONAY BEKLEYEN</span>
                    </div>
                </Link>

                {TYPES.map((t) => {
                    const isSelected = selectedType === t.id;
                    const Icon = t.icon;
                    return (
                        <Link
                            key={t.id}
                            href={`/admin/officials?type=${t.id}`}
                            className={`group p-4 rounded-3xl border transition-all ${isSelected
                                ? `${t.bg} ${t.borderColor} shadow-xl scale-105`
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-red-200"}`}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Icon className={`w-7 h-7 ${isSelected ? t.color : "text-zinc-400 group-hover:text-zinc-600"}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest italic text-center ${isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                                    {t.label}
                                </span>
                            </div>
                        </Link>
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
                            {selectedStatus === "unapproved" ? "ONAY BEKLEYENLER" : (selectedType ? TYPES.find(t => t.id === selectedType)?.label : "TÜM GÖREVLİLER")}
                        </h2>
                        <p className="text-xs text-zinc-500 font-bold tracking-tight uppercase italic">{filtered.length} KAYIT BULUNDU</p>
                    </div>
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
                            onPromote={() => handlePromote(off.user?.id)}
                        />
                    ))
                )}
            </div>

            {/* Modals & Overlays */}
            {selectedOfficial && (
                <ProfileDetailModal
                    official={selectedOfficial}
                    onClose={() => setSelectedOfficial(null)}
                    onToggleActive={() => handleToggleStatus(selectedOfficial.user?.id)}
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
