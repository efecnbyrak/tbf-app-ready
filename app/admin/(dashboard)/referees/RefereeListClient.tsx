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
            if (code === "MANAGERS") return ref.user?.role?.name === "ADMIN";
            // If it's a manager, don't show in other categories
            if (ref.user?.role?.name === "ADMIN") return false;

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
            {/* Header / Navigation Folders Aesthetic */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                <div>
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

                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Hakemlerde ara (İsim, TCKN)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl focus:border-red-600 outline-none transition-all font-bold text-zinc-900 dark:text-white shadow-sm hover:shadow-md"
                    />
                </div>
            </div>

            {/* Stats Summary */}
            <div className="flex gap-4 overflow-x-auto pb-4 px-4 scrollbar-hide">
                {ORDERED_CLASSIFICATIONS.map(code => {
                    const label = CLASSIFICATION_MAP[code];
                    const count = grouped[label]?.length || 0;
                    if (count === 0 && code !== "MANAGERS") return null;
                    return (
                        <div key={code} className="flex-shrink-0 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border-2 border-zinc-50 dark:border-zinc-800 shadow-sm">
                            <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">{label}</span>
                            <span className="text-lg font-black text-zinc-900 dark:text-white italic">{count}</span>
                        </div>
                    )
                })}
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
                    isSuperAdmin={currentUserRole === "SUPER_ADMIN"}
                    onClose={() => setSelectedOfficial(null)}
                    onToggleActive={() => handleToggleStatus(selectedOfficial.user?.id)}
                    onPromote={() => handlePromote(selectedOfficial.user?.id)}
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
