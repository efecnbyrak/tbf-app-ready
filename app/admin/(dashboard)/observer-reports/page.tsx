import { getObserverReports } from "@/app/actions/reports";
import { ClipboardList, Sparkles } from "lucide-react";
import { ObserverReportCard } from "./ObserverReportCard";
import { verifySession } from "@/lib/session";

export default async function AdminReportsPage() {
    const session = await verifySession();
    const reportsResult = await getObserverReports();

    // Handle error state
    if ('error' in reportsResult) {
        return (
            <div className="p-8 bg-red-50 text-red-700 border border-red-200 rounded-3xl">
                <h2 className="font-black uppercase tracking-tight mb-2">HATA OLUŞTU</h2>
                <p className="text-sm font-bold">{reportsResult.error}</p>
            </div>
        );
    }

    const reports = reportsResult;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 rotate-3">
                        <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">GÖZLEMCİ RAPORLARI</h1>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-red-600" />
                            Sistemdeki Tüm Saha Raporları
                        </p>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-widest block leading-none mb-1">Toplam</span>
                    <span className="text-xl font-black text-zinc-900 dark:text-white">{reports.length}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {reports.length > 0 ? (
                    reports.map((report: any) => (
                        <ObserverReportCard key={report.id} report={report} currentUserRole={session.role} />
                    ))
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-500">
                        <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-bold">Henüz kaydedilmiş bir rapor bulunmuyor.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
