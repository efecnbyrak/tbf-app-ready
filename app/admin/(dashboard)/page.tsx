import { db } from "@/lib/db";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { Users, FileText, CheckCircle, BarChart3 } from "lucide-react";
import { formatClassification } from "@/lib/format-utils";
import { AdminDashboardCharts } from "@/components/admin/AdminDashboardCharts";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const { startDate } = await getAvailabilityWindow();

    // Execute all queries in parallel
    const [
        refereesCountRaw,
        officialsCountRaw,
        formsThisWeek,
        latestRegistrations,
        monthlyRegistrations,
        classificationDistribution,
        regionDistribution
    ] = await Promise.all([
        // 1. Total Referees
        db.referee.count(),

        // 2. Total Officials
        db.generalOfficial.count(),

        // 3. Forms Submitted This Week
        db.availabilityForm.count({ where: { weekStartDate: startDate } }),

        // 4. Latest Registrations (Combining both)
        db.$queryRaw<Array<{
            id: string;
            firstName: string;
            lastName: string;
            officialType: string | null;
            tckn: string | null;
            createdAt: Date | string;
        }>>`
            (SELECT id::text, "firstName", "lastName", 'REFEREE' as "officialType", tckn, "createdAt" 
            FROM referees)
            UNION ALL
            (SELECT id::text, "firstName", "lastName", "officialType", tckn, "createdAt" 
            FROM general_officials)
            ORDER BY "createdAt" DESC 
            LIMIT 5
        `,

        // 5. Monthly Registrations (Last 6 Months - Combining both)
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

        // 6. Classification Distribution (Only Referees)
        db.referee.groupBy({
            by: ['classification'],
            _count: {
                id: true
            }
        }),

        // 7. Region Distribution (Top 10 Cities - Combining both)
        db.$queryRaw<Array<{ name: string; count: bigint }>>`
            SELECT r.name, COUNT(*) as count
            FROM regions r
            LEFT JOIN "_RefereeToRegion" rtr ON r.id = rtr."B"
            LEFT JOIN "_GeneralOfficialToRegion" gotr ON r.id = gotr."B"
            GROUP BY r.name
            ORDER BY count DESC
            LIMIT 10
        `
    ]);

    const totalReferees = Number(refereesCountRaw || 0);
    const totalOfficials = Number(officialsCountRaw || 0);

    // Format chart data
    const MONTH_TR: Record<string, string> = {
        '01': 'Ocak', '02': 'Şubat', '03': 'Mart', '04': 'Nisan',
        '05': 'Mayıs', '06': 'Haziran', '07': 'Temmuz', '08': 'Ağustos',
        '09': 'Eylül', '10': 'Ekim', '11': 'Kasım', '12': 'Aralık'
    };

    const registrationChartData = monthlyRegistrations.map(r => ({
        month: MONTH_TR[r.month] || r.month,
        count: Number(r.count)
    }));

    const classificationChartData = classificationDistribution
        .map(c => ({
            name: formatClassification(c.classification),
            value: Number(c._count.id)
        }))
        .filter(item => item.value > 0);


    const regionChartData = regionDistribution.map(r => ({
        name: r.name,
        count: Number(r.count)
    }));

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Yönetici Paneli</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Referees Count */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-sm font-medium uppercase">Hakemler</h3>
                        <p className="text-3xl font-bold mt-1">{totalReferees}</p>
                    </div>
                </div>

                {/* Officials Count */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-700 rounded-lg">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-sm font-medium uppercase">Masa & Saha</h3>
                        <p className="text-3xl font-bold mt-1">{totalOfficials}</p>
                    </div>
                </div>

                {/* Forms This Week */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-sm font-medium uppercase">Bu Hafta Bildirim</h3>
                        <p className="text-3xl font-bold mt-1">{formsThisWeek}</p>
                        <p className="text-xs text-zinc-400">Genel Toplam</p>
                    </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                    <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-zinc-500 text-sm font-medium uppercase">Bildirim Oranı</h3>
                        <p className="text-3xl font-bold mt-1">
                            {(totalReferees + totalOfficials) > 0 ? Math.round((formsThisWeek / (totalReferees + totalOfficials)) * 100) : 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">İstatistiksel Analiz</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Veri Görselleştirme</p>
                    </div>
                </div>
                <AdminDashboardCharts
                    registrationData={registrationChartData}
                    classificationData={classificationChartData}
                    regionData={regionChartData}
                />
            </div>

            {/* Recent Registrations Section */}
            <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Son Kayıt Olanlar</h2>
                    <a href="/admin/referees" className="text-sm text-red-600 hover:text-red-700 font-medium">Tümünü Gör</a>
                </div>

                {/* Desktop View (Table) */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 uppercase text-xs font-semibold">
                            <tr>
                                <th className="px-6 py-3">Ad Soyad</th>
                                <th className="px-6 py-3">Görev/Klasman</th>
                                <th className="px-6 py-3">TCKN</th>
                                <th className="px-6 py-3">Kayıt Tarihi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {latestRegistrations.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                        Henüz kayıtlı kullanıcı yok.
                                    </td>
                                </tr>
                            ) : (
                                latestRegistrations.map((user) => {
                                    const maskedTckn = user.tckn
                                        ? `${user.tckn.substring(0, 2)}*******${user.tckn.substring(9)}`
                                        : '***********';

                                    const roleLabels: Record<string, string> = {
                                        "REFEREE": "Hakem",
                                        "TABLE": "Masa Görevlisi",
                                        "OBSERVER": "Gözlemci",
                                        "HEALTH": "Sağlıkçı",
                                        "STATISTICIAN": "İstatistikçi",
                                        "TABLE_STATISTICIAN": "Masa & İstatistik",
                                        "TABLE_HEALTH": "Masa & Sağlık",
                                        "FIELD_COMMISSIONER": "Saha Komiseri"
                                    };
                                    const roleLabel = roleLabels[user.officialType || ""] || user.officialType || "Belirsiz";

                                    return (
                                        <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold ${user.officialType === 'REFEREE'
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-orange-100 text-orange-700'
                                                    }`}>
                                                    {roleLabel}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 font-mono text-zinc-500">
                                                {maskedTckn}
                                            </td>
                                            <td className="px-6 py-3 text-zinc-500">
                                                {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View (Cards) */}
                <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                    {latestRegistrations.length === 0 ? (
                        <div className="px-6 py-8 text-center text-zinc-500">
                            Henüz kayıtlı kullanıcı yok.
                        </div>
                    ) : (
                        latestRegistrations.map((user) => {
                            const maskedTckn = user.tckn
                                ? `${user.tckn.substring(0, 2)}*******${user.tckn.substring(9)}`
                                : '***********';

                            const roleLabels: Record<string, string> = {
                                "REFEREE": "Hakem",
                                "TABLE": "Masa Görevlisi",
                                "OBSERVER": "Gözlemci",
                                "HEALTH": "Sağlıkçı",
                                "STATISTICIAN": "İstatistikçi",
                                "TABLE_STATISTICIAN": "Masa & İstatistik",
                                "TABLE_HEALTH": "Masa & Sağlık",
                                "FIELD_COMMISSIONER": "Saha Komiseri"
                            };
                            const roleLabel = roleLabels[user.officialType || ""] || user.officialType || "Belirsiz";

                            return (
                                <div key={user.id} className="p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                                            {user.firstName} {user.lastName}
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.officialType === 'REFEREE'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-orange-100 text-orange-700'
                                            }`}>
                                            {roleLabel}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-xs text-zinc-500">
                                        <span className="font-mono">{maskedTckn}</span>
                                        <span>
                                            {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">Hızlı Erişim</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <a href="/admin/referees" className="block p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors border border-zinc-200 dark:border-zinc-700">
                        <span className="font-semibold block mb-1">Hakem Listesi & Klasmanlar</span>
                        <span className="text-sm text-zinc-500">Hakemleri görüntüle ve klasmanlarını düzenle.</span>
                    </a>
                    <a href="/admin/availability" className="block p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg hover:bg-zinc-100 transition-colors border border-zinc-200 dark:border-zinc-700">
                        <span className="font-semibold block mb-1">Uygunluk Listesi & Excel</span>
                        <span className="text-sm text-zinc-500">Bu haftaki bildirimleri incele ve indir.</span>
                    </a>
                </div>
            </div>
        </div>
    );
}
