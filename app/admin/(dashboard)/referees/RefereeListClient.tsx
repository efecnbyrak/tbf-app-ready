"use client";

import { useState, useTransition } from "react";
import { Search, Users, ShieldAlert, Loader2 } from "lucide-react";
import { OfficialRow } from "@/components/admin/OfficialRow";
import { ProfileDetailModal } from "@/components/admin/ProfileDetailModal";
import { toggleUserActiveStatus, promoteToAdmin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";

interface RefereeListClientProps {
    initialReferees: any[];
    refereeTypeMap: Record<string, string>;
    currentUserRole?: string | null;
}

const CLASSIFICATION_MAP: Record<string, string> = {
    "UNAPPROVED": "Onay Bekleyenler",
    "BELIRLENMEMIS": "Belirtilmemiş",
    "A": "A Klasmanı",
    "B": "B Klasmanı",
    "C": "C Klasmanı",
    "IL_HAKEMI": "İl Hakemi",
    "ADAY_HAKEM": "Aday Hakem"
};

const ORDERED_CLASSIFICATIONS = [
    "UNAPPROVED",
    "BELIRLENMEMIS",
    "A",
    "B",
    "C",
    "IL_HAKEMI",
    "ADAY_HAKEM"
];

export function RefereeListClient({ initialReferees, refereeTypeMap, currentUserRole }: RefereeListClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOfficial, setSelectedOfficial] = useState<any>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const filteredReferees = initialReferees.filter(ref => {
        const fullName = `${ref.firstName} ${ref.lastName}`.toLowerCase();
        const tckn = ref.tckn.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || tckn.includes(query);
    });

    const grouped = ORDERED_CLASSIFICATIONS.reduce((acc, code) => {
        const label = CLASSIFICATION_MAP[code];
        acc[label] = filteredReferees.filter(ref => {
            if (code === "UNAPPROVED") return !ref.user?.isApproved;
            if (ref.user?.isApproved === false && code !== "UNAPPROVED") return false;
            if (code === "BELIRLENMEMIS") {
                return !ref.classification || ref.classification === "" || ref.classification === "BELIRLENMEMIS" || !CLASSIFICATION_MAP[ref.classification];
            }
            return ref.classification === code;
        });
        return acc;
    }, {} as Record<string, any[]>);

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

    return (
        <div className="space-y-12 pb-20">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Hakem Listesi</h2>
                        <p className="text-sm text-zinc-500 font-medium tracking-tight uppercase italic">{filteredReferees.length} KAYIT BULUNDU</p>
                    </div>
                </div>

                {/* Search Bar */}
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

            {/* List Content */}
            <div className="space-y-16">
                {ORDERED_CLASSIFICATIONS.map(code => {
                    const label = CLASSIFICATION_MAP[code];
                    const groupReferees = grouped[label];

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
                                            onPromote={() => handlePromote(ref.user?.id)}
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
                    onClose={() => setSelectedOfficial(null)}
                    onToggleActive={() => handleToggleStatus(selectedOfficial.user?.id)}
                />
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
