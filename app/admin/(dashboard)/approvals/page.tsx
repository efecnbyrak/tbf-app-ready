import { db } from "@/lib/db";
import { User as UserIcon } from "lucide-react";
import { ApprovalCard } from "@/components/admin/ApprovalCard";

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
    const pendingUsers = await db.user.findMany({
        where: { isApproved: false },
        include: {
            referee: true,
            official: true
        },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Onay Bekleyenler</h1>
                    <p className="text-zinc-500 font-medium mt-1">Sisteme yeni kayıt olan hakemlerin yönetim merkezi.</p>
                </div>
                <div className="px-6 py-2.5 bg-zinc-900 text-white rounded-2xl text-sm font-black shadow-lg shadow-zinc-900/20">
                    TOPLAM: {pendingUsers.length} ADAY
                </div>
            </header>

            {pendingUsers.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl p-24 text-center">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-950 rounded-full flex items-center justify-center mx-auto mb-6">
                        <UserIcon className="w-10 h-10 text-zinc-300" />
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Bekleyen onay bulunmuyor</h3>
                    <p className="text-zinc-500 font-medium">Şu an için onay listesi tamamen boş. Her şey yolunda!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {pendingUsers.map((user: any) => (
                        <ApprovalCard key={user.id} user={user} />
                    ))}
                </div>
            )}
        </div>
    );
}
