
import { db } from "@/lib/db";
import { OfficialCard } from "@/components/admin/OfficialCard";
import Link from "next/link";
import { Users, Table, Shield, Activity, FileSpreadsheet } from "lucide-react";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ type?: string }>;
}

export default async function OfficialsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const selectedType = params.type;

    // Fetch Referee Types manually via Raw Query to bypass stale Prisma Client
    const refereeTypesRaw = await db.$queryRaw<Array<{ id: number, officialType: string }>>`
        SELECT id, "officialType" FROM referees
    `;
    const refereeTypeMap = new Map(refereeTypesRaw.map((r: any) => [r.id, r.officialType || "REFEREE"]));

    // Fetch all records and filter in memory
    const allOfficials = await db.referee.findMany({
        include: { user: true, regions: true },
        orderBy: { createdAt: 'desc' }
    });

    const officials = allOfficials.filter(off => {
        const type = refereeTypeMap.get(off.id) || "REFEREE";
        if (selectedType) {
            return type === selectedType;
        }
        return type !== "REFEREE";
    });

    // Folder definitions
    const types = [
        { id: "TABLE", label: "Masa Görevlileri", icon: Table, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20", borderColor: "border-orange-200 dark:border-orange-800" },
        { id: "OBSERVER", label: "Gözlemciler", icon: Shield, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20", borderColor: "border-blue-200 dark:border-blue-800" },
        { id: "STATISTICIAN", label: "İstatistikçiler", icon: FileSpreadsheet, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20", borderColor: "border-purple-200 dark:border-purple-800" },
        { id: "HEALTH", label: "Sağlık Görevlileri", icon: Activity, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20", borderColor: "border-green-200 dark:border-green-800" },
    ];

    return (
        <div className="space-y-8">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Genel Görevliler</h1>
                <p className="text-zinc-500">
                    Masa görevlileri, gözlemciler ve diğer teknik personeli yönetin.
                </p>
            </header>

            {/* Folders / Categories */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    href="/admin/officials"
                    className={`p-4 rounded-xl border transition-all ${!selectedType
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                >
                    <div className="flex flex-col items-center gap-2">
                        <Users className={`w-8 h-8 ${!selectedType ? "text-white" : "text-zinc-500"}`} />
                        <span className="font-semibold">Tümü</span>
                    </div>
                </Link>

                {types.map((t) => {
                    const isSelected = selectedType === t.id;
                    const Icon = t.icon;
                    return (
                        <Link
                            key={t.id}
                            href={`/admin/officials?type=${t.id}`}
                            className={`p-4 rounded-xl border transition-all ${isSelected
                                ? `${t.bg} ${t.borderColor} shadow-lg scale-105`
                                : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                        >
                            <div className="flex flex-col items-center gap-2 relative">
                                {isSelected && (
                                    <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-current text-current opacity-50" />
                                )}
                                <Icon className={`w-8 h-8 ${t.color}`} />
                                <span className={`font-semibold ${isSelected ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}>
                                    {t.label}
                                </span>
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Grid Listing */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {selectedType ? types.find(t => t.id === selectedType)?.label : "Tüm Görevliler"}
                    </h2>
                    <span className="text-sm text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                        {officials.length} Kişi
                    </span>
                </div>

                {officials.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-xl p-12 text-center border dashed border-zinc-200 dark:border-zinc-800">
                        <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-500">Bu kategoride kayıtlı görevli bulunmamaktadır.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {officials.map((off) => (
                            <OfficialCard
                                key={off.id}
                                official={{
                                    ...off,
                                    officialType: refereeTypeMap.get(off.id) || "REFEREE"
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
