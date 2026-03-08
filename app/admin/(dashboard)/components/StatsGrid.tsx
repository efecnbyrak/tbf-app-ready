import { Users, FileText, CheckCircle } from "lucide-react";

interface StatsGridProps {
    totalReferees: number;
    totalOfficials: number;
    formsThisWeek: number;
}

export function StatsGrid({ totalReferees, totalOfficials, formsThisWeek }: StatsGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Referees Count */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Hakemler</h3>
                    <p className="text-3xl font-black mt-1 text-zinc-900 dark:text-white">{totalReferees}</p>
                </div>
            </div>

            {/* Officials Count */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                <div className="p-3 bg-orange-100 text-orange-700 rounded-lg">
                    <Users size={24} />
                </div>
                <div>
                    <h3 className="text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Genel Görevliler</h3>
                    <p className="text-3xl font-black mt-1 text-zinc-900 dark:text-white">{totalOfficials}</p>
                </div>
            </div>

            {/* Forms This Week */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                    <FileText size={24} />
                </div>
                <div>
                    <h3 className="text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Bu Hafta Bildirim</h3>
                    <p className="text-3xl font-black mt-1 text-zinc-900 dark:text-white">{formsThisWeek}</p>
                    <p className="text-[10px] font-bold text-zinc-500 dark:text-zinc-500 uppercase mt-0.5">Genel Toplam</p>
                </div>
            </div>

            {/* Completion Rate */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                <div className="p-3 bg-purple-100 text-purple-700 rounded-lg">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h3 className="text-zinc-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">Bildirim Oranı</h3>
                    <p className="text-3xl font-black mt-1 text-zinc-900 dark:text-white">
                        {(totalReferees + totalOfficials) > 0 ? Math.round((formsThisWeek / (totalReferees + totalOfficials)) * 100) : 0}%
                    </p>
                </div>
            </div>
        </div>
    );
}
