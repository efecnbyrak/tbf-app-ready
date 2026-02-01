import { db } from "@/lib/db";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import { Users, FileText, CheckCircle } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const { startDate } = await getAvailabilityWindow();

    // Execute all queries in parallel
    const [refereesCountRaw, officialsCountRaw, formsThisWeek, latestRegistrations] = await Promise.all([
        // 1. Total Referees
        db.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM referees WHERE "officialType" = 'REFEREE'`,

        // 2. Total Officials
        db.$queryRaw<Array<{ count: bigint }>>`SELECT COUNT(*) as count FROM referees WHERE "officialType" != 'REFEREE' AND "officialType" IS NOT NULL`,

        // 3. Forms Submitted This Week
        db.availabilityForm.count({ where: { weekStartDate: startDate } }),

        // 4. Latest Registrations
        db.$queryRaw<Array<{
            id: string;
            firstName: string;
            lastName: string;
            officialType: string | null;
            tckn: string | null;
            createdAt: Date | string;
        }>>`
            SELECT id, "firstName", "lastName", "officialType", tckn, "createdAt" 
            FROM referees 
            ORDER BY "createdAt" DESC 
            LIMIT 5
        `
    ]);

    const totalReferees = Number(refereesCountRaw[0]?.count || 0);
    const totalOfficials = Number(officialsCountRaw[0]?.count || 0);

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

            {/* Recent Registrations Section */}
            <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Son Kayıt Olanlar</h2>
                    <a href="/admin/referees" className="text-sm text-red-600 hover:text-red-700 font-medium">Tümünü Gör</a>
                </div>
                <div className="overflow-x-auto">
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
                                    // Mask TCKN: First 2, masked, last 2
                                    const maskedTckn = user.tckn
                                        ? `${user.tckn.substring(0, 2)}*******${user.tckn.substring(9)}`
                                        : '***********';

                                    // Map Role
                                    const roleLabels: Record<string, string> = {
                                        "REFEREE": "Hakem",
                                        "TABLE": "Masa Görevlisi",
                                        "OBSERVER": "Gözlemci",
                                        "HEALTH": "Sağlıkçı",
                                        "STATISTICIAN": "İstatistikçi"
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
