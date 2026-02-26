
import { db } from "@/lib/db";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { ExportButton } from "./ExportButton";
import { CleanupButton } from "@/components/admin/CleanupButton";
import { AvailabilityList } from "./AvailabilityList";
import Link from "next/link";
import { ensureSchemaColumns } from "@/app/actions/auth";
import { User, Users, Table, Shield, Activity, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ group?: string; type?: string; week?: string }>;
}

export default async function AvailabilityAdminPage({ searchParams }: PageProps) {
    await ensureSchemaColumns();
    const params = await searchParams;
    const { startDate: currentStartDate, endDate: currentEndDate } = await getAvailabilityWindow();

    const isLastWeek = params.week === "last";
    let startDate = currentStartDate;
    let endDate = currentEndDate;

    if (isLastWeek) {
        startDate = new Date(currentStartDate);
        startDate.setDate(currentStartDate.getDate() - 7);
        endDate = new Date(currentEndDate);
        endDate.setDate(currentEndDate.getDate() - 7);
    }

    // Fetch week number
    const weekNumberSetting = await db.systemSetting.findUnique({ where: { key: "CURRENT_WEEK_NUMBER" } });
    const currentWeekNumberRaw = parseInt(weekNumberSetting?.value || "1");
    const displayWeekNumber = isLastWeek ? currentWeekNumberRaw - 1 : currentWeekNumberRaw;

    const formattedStart = format(startDate, "d MMMM", { locale: tr });
    const formattedEnd = format(endDate, "d MMMM yyyy", { locale: tr });

    // Determine active group and type
    const activeGroup = params.group || "REFEREE"; // "REFEREE" or "GENERAL"
    const activeType = params.type; // "TABLE", "OBSERVER", etc.

    // Fetch forms with database-level filtering
    const forms = await db.availabilityForm.findMany({
        where: {
            weekStartDate: startDate,
            ...(activeGroup === "REFEREE"
                ? { referee: { isNot: null } }
                : {
                    official: {
                        isNot: null,
                        officialType: activeType ? activeType : { not: "REFEREE" }
                    }
                }
            )
        } as any,
        include: {
            referee: {
                include: { regions: true }
            },
            official: {
                include: { regions: true }
            },
            days: true
        },
        orderBy: { updatedAt: 'desc' }
    });

    // Sub-types for General
    const generalTypes = [
        { id: "TABLE", label: "Masa Görevlileri", icon: Table },
        { id: "OBSERVER", label: "Gözlemciler", icon: Shield },
        { id: "STATISTICIAN", label: "İstatistik Görevlileri", icon: FileSpreadsheet },
        { id: "HEALTH", label: "Sağlık Görevlileri", icon: Activity },
        { id: "FIELD_COMMISSIONER", label: "Saha Komiserleri", icon: Shield },
        { id: "TABLE_HEALTH", label: "Masa & Sağlık", icon: Activity },
        { id: "TABLE_STATISTICIAN", label: "Masa & İstatistik", icon: FileSpreadsheet },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                            Uygunluk Formları
                        </h1>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-bold border border-red-200 dark:border-red-800">
                            {displayWeekNumber}. Hafta {isLastWeek ? "(Geçen Hafta)" : "(Güncel)"}
                        </span>
                    </div>
                    <p className="text-zinc-500 font-medium">
                        Dönem: {formattedStart} - {formattedEnd}
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Week Selector */}
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex">
                        <Link
                            href={`/admin/availability?week=current&group=${activeGroup}${activeType ? `&type=${activeType}` : ''}`}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isLastWeek ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
                        >
                            Güncel Hafta
                        </Link>
                        <Link
                            href={`/admin/availability?week=last&group=${activeGroup}${activeType ? `&type=${activeType}` : ''}`}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isLastWeek ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
                        >
                            Geçen Hafta
                        </Link>
                    </div>
                    <div className="flex gap-2">
                        <CleanupButton />
                        <ExportButton group={activeGroup} type={activeType} />
                    </div>
                </div>
            </div>

            {/* Main Tabs: Referee vs General */}
            <div className="border-b border-zinc-200 dark:border-zinc-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <Link
                        href={`/admin/availability?group=REFEREE&week=${isLastWeek ? 'last' : 'current'}`}
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
                        href={`/admin/availability?group=GENERAL&week=${isLastWeek ? 'last' : 'current'}`}
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
                        href={`/admin/availability?group=GENERAL&week=${isLastWeek ? 'last' : 'current'}`}
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
                                href={`/admin/availability?group=GENERAL&type=${t.id}&week=${isLastWeek ? 'last' : 'current'}`}
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
                forms={forms as any}
                startDate={startDate}
                endDate={endDate}
            />
        </div>
    );
}
