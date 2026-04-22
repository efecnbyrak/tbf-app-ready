import Link from "next/link";
import { Suspense } from "react";
import { StatsGrid } from "./components/StatsGrid";
import { RecentRegistrations } from "./components/RecentRegistrations";
import { BarChart3, Users } from "lucide-react";
import { DashboardChartsWrapper } from "@/components/admin/DashboardChartsWrapper";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { formatClassification } from "@/lib/format-utils";

async function StatsSection() {
    const { startDate } = await getAvailabilityWindow();
    const [refereesCount, officialsCount, formsThisWeek] = await Promise.all([
        db.referee.count(),
        (db as any).generalOfficial.count(),
        db.availabilityForm.count({ where: { weekStartDate: startDate } }),
    ]);

    return <StatsGrid
        totalReferees={Number(refereesCount)}
        totalOfficials={Number(officialsCount)}
        formsThisWeek={formsThisWeek}
    />;
}

async function RegistrationsSection() {
    const latestRegistrations = await db.$queryRaw<Array<any>>`
        (SELECT id::text, "firstName", "lastName", 'REFEREE' as "officialType", email, "createdAt" 
        FROM referees)
        UNION ALL
        (SELECT id::text, "firstName", "lastName", "officialType", email, "createdAt" 
        FROM general_officials)
        ORDER BY "createdAt" DESC 
        LIMIT 5
    `;
    return <RecentRegistrations latestRegistrations={latestRegistrations} />;
}

async function ChartsSection() {
    const [monthlyRegistrations, classificationDistribution] = await Promise.all([
        db.$queryRaw<Array<{ month: string; count: bigint }>>`
            SELECT 
                TO_CHAR("createdAt", 'MM') as month,
                COUNT(*) as count
            FROM (
                SELECT "createdAt" FROM referees
                UNION ALL
                SELECT "createdAt" FROM general_officials
            ) combined
            WHERE "createdAt" > NOW() - INTERVAL '6 months'
            GROUP BY month
            ORDER BY month ASC
        `,
        db.referee.groupBy({
            by: ['classification'],
            _count: { id: true }
        })
    ]);

    const MONTH_TR: Record<string, string> = {
        '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
        '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
        '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
    };

    const registrationChartData = monthlyRegistrations.map((r: any) => ({
        month: MONTH_TR[r.month] || r.month,
        count: Number(r.count)
    }));

    const classificationChartData = classificationDistribution
        .map((c: any) => ({
            name: formatClassification(c.classification),
            value: Number(c._count.id)
        }))
        .filter((item: any) => item.value > 0);

    return (
        <DashboardChartsWrapper
            registrationData={registrationChartData}
            classificationData={classificationChartData}
        />
    );
}

function SectionLoading({ height = "h-32" }: { height?: string }) {
    return <div className={`w-full ${height} bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl`} />;
}

import AdminHub from "./components/AdminHub";
import { PendingApprovalsNotifier } from "./components/PendingApprovalsNotifier";

export default async function AdminDashboard() {
    const session = await verifySession();
    const role = session.role;

    // Fetch pending approvals for the notification system
    const pendingCount = await db.user.count({ where: { isApproved: false } });

    // --- TEMPORARY FIX FOR ALTAN RENKSOY ---
    try {
        const altan = await db.generalOfficial.findFirst({
            where: { firstName: { contains: "Altan", mode: "insensitive" }, lastName: { contains: "Renksoy", mode: "insensitive" } },
            include: { regions: true }
        });
        if (altan && !altan.regions.some((r: any) => r.name === "Anadolu")) {
            const anadolu = await db.region.findUnique({ where: { name: "Anadolu" } });
            if (anadolu) {
                await db.generalOfficial.update({
                    where: { id: altan.id },
                    data: { regions: { set: [{ id: anadolu.id }] } }
                });
                console.log("[FIX] Updated Altan Renksoy's region to Anadolu.");
            }
        }

        // Also check if referee just in case
        const altanRef = await db.referee.findFirst({
            where: { firstName: { contains: "Altan", mode: "insensitive" }, lastName: { contains: "Renksoy", mode: "insensitive" } },
            include: { regions: true }
        });
        if (altanRef && !altanRef.regions.some((r: any) => r.name === "Anadolu")) {
            const anadolu = await db.region.findUnique({ where: { name: "Anadolu" } });
            if (anadolu) {
                await db.referee.update({
                    where: { id: altanRef.id },
                    data: { regions: { set: [{ id: anadolu.id }] } }
                });
                console.log("[FIX] Updated Altan Renksoy's (Referee) region to Anadolu.");
            }
        }
    } catch (e) {
        console.error("Failed to run Altan Renksoy fix:", e);
    }
    // --- END TEMPORARY FIX ---

    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { referee: true, official: true }
    });

    const hasReferee = !!user?.referee;
    const hasOfficial = !!user?.official;

    return (
        <div className="pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 md:mb-12 gap-4">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                        Yönetici Paneli
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Sistem Durumu: Çevrimiçi</p>
                    </div>
                </div>
            </div>

            <Suspense fallback={<SectionLoading height="h-32 md:h-24" />}>
                <StatsSection />
            </Suspense>

            {/* Hub Section */}
            <AdminHub role={role} pendingCount={pendingCount} hasReferee={hasReferee} hasOfficial={hasOfficial} />

            {/* Charts Section */}
            <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <BarChart3 className="w-5 h-5 text-white dark:text-zinc-900" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Performans Verileri</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase italic">İstatistiksel Görselleştirme</p>
                    </div>
                </div>
                <Suspense fallback={<SectionLoading height="h-[400px] !rounded-[2.5rem]" />}>
                    <ChartsSection />
                </Suspense>
            </div>

            <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-zinc-500" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Son Kayıtlar</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Yeni katılan üyeler</p>
                    </div>
                </div>
                <Suspense fallback={<SectionLoading height="h-64" />}>
                    <RegistrationsSection />
                </Suspense>
            </div>

            <PendingApprovalsNotifier count={pendingCount} />
        </div>
    );
}
