
import { db } from "@/lib/db";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { ExportButton } from "./ExportButton";
import { CleanupButton } from "@/components/admin/CleanupButton";
import { AvailabilityList } from "./AvailabilityList";
import Link from "next/link";
import { ensureSchemaColumns } from "@/lib/db-heal";
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
    const { startDate: currentStartDate, endDate: currentEndDate, weekNumber } = await getAvailabilityWindow();

    const isLastWeek = params.week === "last";
    let startDate = currentStartDate;
    let endDate = currentEndDate;

    if (isLastWeek) {
        startDate = new Date(currentStartDate);
        startDate.setDate(currentStartDate.getDate() - 7);
        endDate = new Date(currentEndDate);
        endDate.setDate(currentEndDate.getDate() - 7);
    }

    const displayWeekNumber = isLastWeek ? weekNumber - 1 : weekNumber;

    const formattedStart = format(startDate, "d MMMM", { locale: tr });
    const formattedEnd = format(endDate, "d MMMM yyyy", { locale: tr });

    // Determine active group and type
    const activeGroup = params.group || "REFEREE"; // "REFEREE" or "GENERAL"
    const activeType = params.type; // "TABLE", "OBSERVER", etc.

    // Fetch forms with database-level filtering
    // Use a date range to avoid timezone-induced exact-match failures
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(startDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const forms = await db.availabilityForm.findMany({
        where: {
            weekStartDate: {
                gte: rangeStart,
                lte: rangeEnd
            },
            ...(activeGroup === "REFEREE"
                ? { referee: { isNot: null } }
                : {
                    official: activeType
                        ? {
                            is: {
                                officialType: activeType === "TABLE"
                                    ? { in: ["TABLE", "TABLE_HEALTH", "TABLE_STATISTICIAN"] }
                                    : activeType === "HEALTH"
                                        ? { in: ["HEALTH", "TABLE_HEALTH"] }
                                        : activeType === "STATISTICIAN"
                                            ? { in: ["STATISTICIAN", "TABLE_STATISTICIAN"] }
                                            : activeType
                            }
                        }
                        : { isNot: null }
                }
            )
        },
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
    ];

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4">
                {/* Title row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                                Uygunluk Formları
                            </h1>
                            <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs sm:text-sm font-bold border border-red-200 dark:border-red-800">
                                {displayWeekNumber}. Hafta {isLastWeek ? "(Geçen Hafta)" : "(Güncel)"}
                            </span>
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">
                            Dönem: {formattedStart} - {formattedEnd}
                        </p>
                    </div>

                    {/* Week selector + personal form */}
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex">
                            <Link
                                href={`/admin/all-availabilities?week=current&group=${activeGroup}${activeType ? `&type=${activeType}` : ''}`}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${!isLastWeek ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
                            >
                                Güncel Hafta
                            </Link>
                            <Link
                                href={`/admin/all-availabilities?week=last&group=${activeGroup}${activeType ? `&type=${activeType}` : ''}`}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${isLastWeek ? "bg-white dark:bg-zinc-700 shadow-sm text-red-600" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"}`}
                            >
                                Geçen Hafta
                            </Link>
                        </div>
                        <Link
                            href="/admin/availability"
                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg active:scale-95"
                        >
                            <User className="w-4 h-4" />
                            <span className="hidden xs:inline">Kişisel Formum</span>
                            <span className="xs:hidden">Formum</span>
                        </Link>
                    </div>
                </div>

                {/* Action buttons row */}
                <div className="flex flex-wrap items-center gap-2">
                    <CleanupButton />
                    <ExportButton group={activeGroup} type={activeType} week={params.week} />
                </div>
            </div>

            {/* Main Tabs: Referee vs General */}
            <div className="border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max" aria-label="Tabs">
                    <Link
                        href={`/admin/all-availabilities?group=REFEREE&week=${isLastWeek ? 'last' : 'current'}`}
                        className={`
                            whitespace-nowrap pb-3 sm:pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeGroup === "REFEREE"
                                ? "border-red-600 text-red-600"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}
                        `}
                    >
                        <User className="w-4 h-4 sm:w-5 sm:h-5" />
                        Hakemler
                    </Link>
                    <Link
                        href={`/admin/all-availabilities?group=GENERAL&week=${isLastWeek ? 'last' : 'current'}`}
                        className={`
                            whitespace-nowrap pb-3 sm:pb-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${activeGroup === "GENERAL"
                                ? "border-red-600 text-red-600"
                                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-300"}
                        `}
                    >
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                        Genel Görevliler
                    </Link>
                </nav>
            </div>

            {/* Sub-Tabs for General */}
            {activeGroup === "GENERAL" && (
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                    <Link
                        href={`/admin/all-availabilities?group=GENERAL&week=${isLastWeek ? 'last' : 'current'}`}
                        className={`
                            px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap shrink-0
                            ${!activeType
                                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                                : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"}
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
                                href={`/admin/all-availabilities?group=GENERAL&type=${t.id}&week=${isLastWeek ? 'last' : 'current'}`}
                                className={`
                                    px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0
                                    ${isActive
                                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                                        : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-700"}
                                `}
                            >
                                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
