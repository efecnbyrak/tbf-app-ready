"use client";

import { useState } from "react";
import { OfficialCard } from "@/components/admin/OfficialCard";
import { Search, Users, ShieldAlert } from "lucide-react";

interface RefereeListClientProps {
    initialReferees: any[];
    refereeTypeMap: Record<string, string>;
}

const CLASSIFICATIONS = [
    "Belirtilmemiş",
    "A Klasmanı",
    "B Klasmanı",
    "C Klasmanı",
    "İl Hakemi",
    "Aday Hakem"
];

export function RefereeListClient({ initialReferees, refereeTypeMap }: RefereeListClientProps) {
    const [searchQuery, setSearchQuery] = useState("");

    // Filter and group referees
    const filteredReferees = initialReferees.filter(ref => {
        const fullName = `${ref.firstName} ${ref.lastName}`.toLowerCase();
        const tckn = ref.tckn.toLowerCase();
        const query = searchQuery.toLowerCase();
        return fullName.includes(query) || tckn.includes(query);
    });

    // Grouping logic
    const grouped = CLASSIFICATIONS.reduce((acc, classification) => {
        acc[classification] = filteredReferees.filter(ref => {
            if (classification === "Belirtilmemiş") {
                return !ref.classification || ref.classification === "" || ref.classification === "Belirtilmemiş";
            }
            return ref.classification === classification;
        });
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="space-y-12">
            {/* Top Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">Hakem Listesi</h2>
                        <p className="text-sm text-zinc-500 font-medium">Toplam {filteredReferees.length} sonuç bulundu</p>
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

            {/* Grouped Content */}
            <div className="space-y-16">
                {CLASSIFICATIONS.map(classification => {
                    const groupReferees = grouped[classification];
                    if (groupReferees.length === 0 && searchQuery !== "") return null;
                    if (groupReferees.length === 0 && classification !== "Belirtilmemiş") return null;
                    if (groupReferees.length === 0 && classification === "Belirtilmemiş") return null;

                    return (
                        <section key={classification} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-4 mb-8">
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter">
                                    {classification}
                                </h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-zinc-200 dark:from-zinc-800 to-transparent" />
                                <span className="px-4 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-xs font-black">
                                    {groupReferees.length} HAKEM
                                </span>
                            </div>

                            {groupReferees.length === 0 ? (
                                <div className="p-12 text-center bg-zinc-50 dark:bg-zinc-950 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                    <p className="text-zinc-400 font-medium italic">Bu klasmanda hakem bulunamadı.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                                    {groupReferees.map((ref) => (
                                        <OfficialCard
                                            key={ref.id}
                                            official={{
                                                ...ref,
                                                officialType: refereeTypeMap[ref.id] || "REFEREE"
                                            }}
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
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Sonuç Bulunamadı</h3>
                        <p className="text-zinc-500 font-medium">"{searchQuery}" aramasıyla eşleşen bir hakem yok.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
