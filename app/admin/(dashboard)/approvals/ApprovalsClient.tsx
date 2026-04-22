"use client";

import { useState } from "react";
import { approveUser, rejectUser } from "@/app/actions/admin-users";
import { ApprovalCard } from "@/components/admin/ApprovalCard";
import { Check, X, CheckSquare, Square, Loader2 } from "lucide-react";

export function ApprovalsClient({ users }: { users: any[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [bulkLoading, setBulkLoading] = useState<null | "approve" | "reject">(null);

    const allSelected = users.length > 0 && selectedIds.size === users.length;
    const someSelected = selectedIds.size > 0;

    const toggleSelect = (id: number) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleAll = () => {
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(users.map(u => u.id)));
        }
    };

    const bulkApprove = async () => {
        if (!confirm(`${selectedIds.size} kullanıcıyı onaylamak istediğinize emin misiniz?`)) return;
        setBulkLoading("approve");
        try {
            for (const id of Array.from(selectedIds)) {
                await approveUser(id);
            }
            setSelectedIds(new Set());
        } catch {
            alert("Toplu onay sırasında bir hata oluştu.");
        } finally {
            setBulkLoading(null);
        }
    };

    const bulkReject = async () => {
        if (!confirm(`${selectedIds.size} kullanıcıyı REDDETMEK istediğinize emin misiniz? Bu işlem geri alınamaz ve kullanıcılar silinecektir.`)) return;
        setBulkLoading("reject");
        try {
            for (const id of Array.from(selectedIds)) {
                await rejectUser(id);
            }
            setSelectedIds(new Set());
        } catch {
            alert("Toplu red sırasında bir hata oluştu.");
        } finally {
            setBulkLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Bulk Actions Bar */}
            {users.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <button
                        onClick={toggleAll}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        {allSelected
                            ? <CheckSquare className="w-5 h-5 text-red-600" />
                            : <Square className="w-5 h-5" />
                        }
                        {allSelected ? "Seçimi Kaldır" : "Tümünü Seç"}
                    </button>

                    {someSelected && (
                        <>
                            <span className="text-sm font-bold text-zinc-500">
                                {selectedIds.size} kullanıcı seçildi
                            </span>
                            <div className="flex gap-2 ml-auto flex-wrap">
                                <button
                                    onClick={bulkApprove}
                                    disabled={bulkLoading !== null}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-green-600/20"
                                >
                                    {bulkLoading === "approve"
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <Check className="w-4 h-4" />
                                    }
                                    Toplu Onayla
                                </button>
                                <button
                                    onClick={bulkReject}
                                    disabled={bulkLoading !== null}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-red-600/20"
                                >
                                    {bulkLoading === "reject"
                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                        : <X className="w-4 h-4" />
                                    }
                                    Toplu Reddet
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {users.map((user: any) => (
                    <div key={user.id} className="relative">
                        {/* Selection checkbox */}
                        <button
                            onClick={() => toggleSelect(user.id)}
                            title={selectedIds.has(user.id) ? "Seçimi kaldır" : "Seç"}
                            className={`absolute -top-2 -left-2 z-20 w-7 h-7 rounded-lg border-2 shadow-md flex items-center justify-center transition-all ${
                                selectedIds.has(user.id)
                                    ? "bg-red-600 border-red-600"
                                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 hover:border-red-400"
                            }`}
                        >
                            {selectedIds.has(user.id) && <Check className="w-4 h-4 text-white" />}
                        </button>

                        {/* Ring highlight when selected */}
                        <div className={`rounded-2xl transition-all ${selectedIds.has(user.id) ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-zinc-950" : ""}`}>
                            <ApprovalCard user={user} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
