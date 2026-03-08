"use client";

import { useState } from "react";
import { approveUser, rejectUser } from "@/app/actions/admin-users";
import { Check, X, User as UserIcon, Loader2, Edit3 } from "lucide-react";
import { formatOfficialType } from "@/lib/format-utils";
import dynamic from "next/dynamic";

const ProfileDetailModal = dynamic(() => import("@/components/admin/ProfileDetailModal").then(mod => mod.ProfileDetailModal), {
    ssr: false
});

interface ApprovalCardProps {
    user: any;
}

export function ApprovalCard({ user }: ApprovalCardProps) {
    const [loading, setLoading] = useState<null | 'approve' | 'reject'>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const person = user.referee || user.official;
    const fullName = `${person?.firstName} ${person?.lastName}`;
    const officialType = user.referee ? "REFEREE" : (user.official?.officialType || "REFEREE");

    const handleApprove = async () => {
        if (!confirm(`${fullName} isimli kullanıcıyı onaylamak istediğinize emin misiniz?`)) return;
        setLoading('approve');
        try {
            const res = await approveUser(user.id);
            if (res.success) {
                alert("Kullanıcı başarıyla onaylandı.");
            }
        } catch (error) {
            console.error(error);
            alert("Onaylama işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(null);
        }
    };

    const handleReject = async () => {
        if (!confirm(`${fullName} isimli kullanıcıyı REDDETMEK istediğinize emin misiniz? Bu işlem geri alınamaz ve kullanıcı silinecektir.`)) return;
        setLoading('reject');
        try {
            const res = await rejectUser(user.id);
            if (res.success) {
                alert("Kullanıcı kaydı başarıyla silindi (Reddedildi).");
            }
        } catch (error) {
            console.error(error);
            alert("Reddetme işlemi sırasında bir hata oluştu.");
        } finally {
            setLoading(null);
        }
    };

    return (
        <>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border-2 border-zinc-100 dark:border-zinc-800 p-6 space-y-5 hover:border-red-100 dark:hover:border-red-900/30 transition-all relative overflow-hidden">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-700 dark:text-red-400 font-black text-lg">
                            {person?.firstName?.[0]}{person?.lastName?.[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-zinc-900 dark:text-white tracking-tight">
                                    {fullName}
                                </h3>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-600 transition-all"
                                    title="İsim veya Bilgi Düzenle"
                                >
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                {person?.officialType ? formatOfficialType(person.officialType) : person?.classification ? "Hakem" : "Belirtilmemiş"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2.5 text-sm p-4 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-medium text-xs uppercase">TCKN:</span>
                        <span className="font-mono font-bold text-zinc-900 dark:text-zinc-100 tracking-tighter">{user.tckn}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-medium text-xs uppercase">Telefon:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{person?.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-medium text-xs uppercase">E-posta:</span>
                        <span className="truncate max-w-[150px] font-bold text-zinc-900 dark:text-zinc-100">{person?.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-zinc-500 font-medium text-xs uppercase">Kayıt:</span>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        onClick={handleApprove}
                        disabled={loading !== null}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-green-600/20"
                    >
                        {loading === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        ONAYLA
                    </button>
                    <button
                        onClick={handleReject}
                        disabled={loading !== null}
                        className="flex-1 flex items-center justify-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-600 dark:text-zinc-400 hover:text-red-700 dark:hover:text-red-400 py-3 rounded-xl text-xs font-black transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading === 'reject' ? <Loader2 className="w-4 h-4 animate-spin text-red-600" /> : <X className="w-4 h-4" />}
                        REDDET
                    </button>
                </div>
            </div>

            {isEditModalOpen && person && (
                <ProfileDetailModal
                    official={{
                        ...person,
                        user: user,
                        officialType: officialType
                    }}
                    isSuperAdmin={true}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
}
