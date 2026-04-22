"use client";

import { useTransition, useState } from "react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { User, Calendar, ExternalLink, Trash2, Loader2, AlertCircle } from "lucide-react";
import { deleteObserverReport } from "@/app/actions/reports";
import { useRouter } from "next/navigation";

interface ObserverReportCardProps {
    report: any;
    currentUserRole: string | null;
}

export function ObserverReportCard({ report, currentUserRole }: ObserverReportCardProps) {
    const [isPending, startTransition] = useTransition();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();

    const isAdmin = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(currentUserRole || "");

    const handleDelete = () => {
        startTransition(async () => {
            const res = await deleteObserverReport(report.id);
            if (res.success) {
                setShowDeleteModal(false);
                router.refresh();
            } else {
                alert(res.error || "Rapor silinemedi.");
                setShowDeleteModal(false);
            }
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group relative">
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">Raporu Sil</h3>
                            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6">
                                Bu raporu tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
                                >
                                    İptal
                                </button>
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={handleDelete}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Evet, Sil
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isPending && (
                <div className="absolute inset-0 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Siliniyor...</span>
                </div>
            )}
            <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-3 py-1 rounded-full uppercase tracking-widest border border-red-200/50 dark:border-red-800/50">
                            SAHA RAPORU
                        </span>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {format(new Date(report.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr })}
                        </div>
                    </div>

                    <h2 className="text-xl font-black text-zinc-900 dark:text-white group-hover:text-red-600 transition-colors uppercase tracking-tight">
                        {report.title}
                    </h2>

                    <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap italic">
                        "{report.content}"
                    </p>

                    <div className="pt-4 flex items-center justify-between border-t dark:border-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-500" />
                            </div>
                            <div>
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block leading-none mb-1">Raporlayan</span>
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                    {report.createdBy?.referee
                                        ? `${report.createdBy.referee.firstName} ${report.createdBy.referee.lastName}`
                                        : report.createdBy?.official
                                            ? `${report.createdBy.official.firstName} ${report.createdBy.official.lastName}`
                                            : report.createdBy?.username || "Bilinmiyor"}
                                </span>
                            </div>
                        </div>

                        {isAdmin && (
                            <button
                                onClick={() => setShowDeleteModal(true)}
                                title="Sil"
                                disabled={isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm group/delete disabled:opacity-50"
                            >
                                <Trash2 className="w-3.5 h-3.5 group-hover/delete:scale-110 transition-transform" />
                                <span>SİL</span>
                            </button>
                        )}
                    </div>
                </div>

                {report.imageUrl && (
                    <div className="md:w-64 h-48 md:h-auto rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative group-hover:scale-[1.02] transition-transform">
                        <img src={report.imageUrl} alt="Rapor Görseli" className="w-full h-full object-cover" />
                        <a href={report.imageUrl} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white gap-2 text-xs font-bold">
                            <ExternalLink className="w-4 h-4" /> TAM BOYUT
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
