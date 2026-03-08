import { getMyObserverReports } from "@/app/actions/reports";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { ClipboardList, Calendar, ExternalLink, Sparkles, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function MyReportsPage() {
    const session = await getSession();
    const reportsResult = await getMyObserverReports();

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

    // Determine back link based on role
    const adminRoles = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK", "OBSERVER"];
    const backLink = session && adminRoles.includes(session.role) ? "/admin" : "/referee";

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 rotate-3">
                        <ClipboardList className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight italic uppercase">GÖNDERDİĞİM RAPORLAR</h1>
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1 italic">
                            <Sparkles className="w-3 h-3 text-red-600" />
                            GEÇMİŞ RAPORLARIMIN LİSTESİ
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/referee/reports/new"
                        className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95 uppercase italic"
                    >
                        <Plus className="w-4 h-4" /> YENİ RAPOR OLUŞTUR
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {reports.length > 0 ? (
                    reports.map((report: any) => (
                        <div key={report.id} className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group p-6 md:p-8">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 space-y-4">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-[10px] font-black bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-200/50 dark:border-zinc-800/50 italic">
                                            RAPOR #{report.id}
                                        </span>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest italic">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(report.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                        </div>
                                    </div>

                                    <h2 className="text-xl font-black text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors uppercase tracking-tighter italic">
                                        {report.title}
                                    </h2>

                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap italic font-medium bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                                        "{report.content}"
                                    </p>
                                </div>

                                {report.imageUrl && (
                                    <div className="md:w-48 h-32 md:h-auto rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative group-hover:scale-[1.05] transition-transform shadow-lg">
                                        <img src={report.imageUrl} alt="Rapor Görseli" className="w-full h-full object-cover" />
                                        <a href={report.imageUrl} target="_blank" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white gap-2 text-[10px] font-black tracking-widest">
                                            <ExternalLink className="w-4 h-4" /> GÖRÜNTÜLE
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-full flex items-center justify-center mb-2">
                            <ClipboardList className="w-10 h-10 opacity-20" />
                        </div>
                        <div>
                            <p className="font-black text-xl italic text-zinc-900 dark:text-white uppercase tracking-tighter">Henüz bir raporunuz yok</p>
                            <p className="text-sm font-medium italic">Saha eksikliklerini raporlayarak katkıda bulunabilirsiniz.</p>
                        </div>
                        <Link
                            href="/referee/reports/new"
                            className="mt-4 px-8 py-4 bg-red-600 text-white rounded-2xl font-black text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 uppercase italic"
                        >
                            İLK RAPORUMU OLUŞTUR
                        </Link>
                    </div>
                )}
            </div>

            <div className="pt-4">
                <Link href={backLink} className="inline-flex items-center gap-2 text-zinc-500 hover:text-red-600 font-black text-[10px] tracking-widest uppercase italic transition-colors">
                    <ArrowLeft className="w-4 h-4" /> PANELE GERİ DÖN
                </Link>
            </div>
        </div>
    );
}
