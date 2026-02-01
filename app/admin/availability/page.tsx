
import { db } from "@/lib/db";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { ExportButton } from "./ExportButton";
import { AvailabilityList } from "./AvailabilityList";
import Link from "next/link";
import { User, Users, Table, Shield, Activity, FileSpreadsheet } from "lucide-react";
import { Prisma } from "@prisma/client";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ group?: string; type?: string }>;
}

export default async function AvailabilityAdminPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const { startDate, endDate } = await getAvailabilityWindow();

    // Fetch Referee Types manually via Raw Query to bypass stale Prisma Client
    // Table name is "referees" as per schema @@map
    const refereeTypesRaw = await db.$queryRaw<Array<{ id: number, officialType: string }>>`
        SELECT id, "officialType" FROM referees
    `;
    const refereeTypeMap = new Map(refereeTypesRaw.map((r: any) => [r.id, r.officialType || "REFEREE"]));

    // Determine active group and type
    const activeGroup = params.group || "REFEREE"; // "REFEREE" or "GENERAL"
    const activeType = params.type; // "TABLE", "OBSERVER", etc.

    // Fetch submitted forms (Fetch ALL for this week, filter in memory)
    const allForms = await db.availabilityForm.findMany({
        where: {
            weekStartDate: startDate,
        },
        include: {
            referee: {
                include: { regions: true }
            },
            days: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    // In-Memory Filtering
    const forms = allForms.filter(form => {
        const type = refereeTypeMap.get(form.refereeId) || "REFEREE";

        if (activeGroup === "REFEREE") {
            return type === "REFEREE";
        } else {
            // GENERAL
            if (activeType) {
                return type === activeType;
            } else {
                return type !== "REFEREE";
            }
        }
    });

    // Sub-types for General
    const generalTypes = [
        { id: "TABLE", label: "Masa Görevlileri", icon: Table },
        { id: "OBSERVER", label: "Gözlemciler", icon: Shield },
        { id: "STATISTICIAN", label: "İstatistikçiler", icon: FileSpreadsheet },
        { id: "HEALTH", label: "Sağlık Görevlileri", icon: Activity },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-sans tracking-tight">Uygunluk Bildirimleri</h1>
                    <p className="text-zinc-500 mt-1">
                        {startDate.toLocaleDateString('tr-TR')} - {endDate.toLocaleDateString('tr-TR')} Dönemi
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton group={activeGroup} type={activeType} />
                </div>
            </div>

            {/* Main Tabs: Referee vs General */}
            <div className="border-b border-zinc-200 dark:border-zinc-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <Link
                        href="/admin/availability?group=REFEREE"
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeGroup === "REFEREE"
                                ? "border-red-600 text-red-600"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}
                        `}
                    >
                        <User className="w-5 h-5" />
                        Hakemler
                    </Link>
                    <Link
                        href="/admin/availability?group=GENERAL"
                        className={`
                            whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeGroup === "GENERAL"
                                ? "border-red-600 text-red-600"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}
                        `}
                    >
                        <Users className="w-5 h-5" />
                        Genel Görevliler
                    </Link>
                </nav>
            </div>

            {/* Sub-Tabs for General (Only shown if GENERAL is active) */}
            {activeGroup === "GENERAL" && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <Link
                        href="/admin/availability?group=GENERAL"
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium border transition-colors whitespace-nowrap
                            ${!activeType
                                ? "bg-zinc-900 text-white border-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}
                        `}
                    >
                        Tümü
                    </Link>
                    {generalTypes.map((t) => {
                        const Icon = t.icon;
                        const isActive = activeType === t.id;
                        return (
                            <Link
                                key={t.id}
                                href={`/admin/availability?group=GENERAL&type=${t.id}`}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-medium border transition-colors flex items-center gap-2 whitespace-nowrap
                                    ${isActive
                                        ? "bg-zinc-900 text-white border-zinc-900"
                                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50"}
                                `}
                            >
                                <Icon className="w-4 h-4" />
                                {t.label}
                            </Link>
                        );
                    })}
                </div>
            )}

            <AvailabilityList
                forms={forms.map(form => ({
                    ...form,
                    referee: {
                        ...form.referee,
                        officialType: refereeTypeMap.get(form.refereeId) || "REFEREE"
                    }
                }))}
                startDate={startDate}
                endDate={endDate}
            />
        </div>
    );
}
