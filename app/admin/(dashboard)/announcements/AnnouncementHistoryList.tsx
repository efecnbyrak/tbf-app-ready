"use client";

import { useState } from "react";
import { History } from "lucide-react";
import { AnnouncementDetailModal } from "@/components/admin/AnnouncementDetailModal";

interface AnnouncementHistoryListProps {
    announcements: any[];
}

export default function AnnouncementHistoryList({ announcements }: AnnouncementHistoryListProps) {
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 text-zinc-400">
                <History className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest italic">Son Duyurular</h3>
            </div>

            <div className="space-y-4">
                {announcements.length === 0 ? (
                    <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                        <p className="text-xs font-bold text-zinc-500 uppercase italic">Henüz duyuru gönderilmedi</p>
                    </div>
                ) : (
                    announcements.map((ann: any) => (
                        <div
                            key={ann.id}
                            onClick={() => setSelectedAnnouncement(ann)}
                            className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-pointer hover:border-red-500 transition-colors group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded text-[10px] font-black uppercase">
                                    {ann.target}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-400">
                                    {new Date(ann.createdAt).toLocaleDateString('tr-TR')}
                                </span>
                            </div>
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1 truncate group-hover:text-red-500 transition-colors">{ann.subject}</h4>
                            <p className="text-[10px] text-zinc-500 font-bold mb-3">{ann.sentCount} kişiye ulaştı</p>
                            
                            {/* Latest Readers Avatars */}
                            {ann.reads && ann.reads.length > 0 && (
                                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                                    <div className="flex -space-x-2">
                                        {ann.reads.map((receipt: any, idx: number) => {
                                            const roleDetails = receipt.user?.referee || receipt.user?.official;
                                            const imageUrl = roleDetails?.imageUrl;
                                            const fallback = roleDetails ? `${(roleDetails.firstName?.[0] || '')}${(roleDetails.lastName?.[0] || '')}`.toUpperCase() : "USR";
                                            return (
                                                <div key={idx} className="w-6 h-6 rounded-full border border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black text-zinc-500 overflow-hidden shadow-sm z-10 hover:z-20 transition-all hover:scale-110" title={roleDetails ? `${roleDetails.firstName} ${roleDetails.lastName}` : "Bilinmeyen Kullanıcı"}>
                                                    {imageUrl ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={imageUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{fallback}</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <span className="text-[9px] font-bold text-zinc-400 italic">son okuyanlar</span>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {selectedAnnouncement && (
                <AnnouncementDetailModal
                    announcement={selectedAnnouncement}
                    onClose={() => setSelectedAnnouncement(null)}
                />
            )}
        </div>
    );
}
