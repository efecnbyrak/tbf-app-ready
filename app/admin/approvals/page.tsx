import { db } from "@/lib/db";
import { approveUser, rejectUser } from "@/app/actions/admin-users";
import { Check, X, User as UserIcon } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ApprovalsPage() {
    const pendingUsers = await db.user.findMany({
        where: { isApproved: false },
        include: { referee: true },
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Onay Bekleyenler</h1>
                    <p className="text-zinc-500 mt-1">Sisteme yeni kayıt olan ve onay bekleyen hakemlerin listesi.</p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-800 px-4 py-2 rounded-lg text-sm font-medium">
                    Toplam: {pendingUsers.length}
                </div>
            </div>

            {pendingUsers.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center">
                    <UserIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white">Bekleyen onay yok</h3>
                    <p className="text-zinc-500">Şu an için onay bekleyen yeni bir kullanıcı bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingUsers.map((user) => (
                        <div key={user.id} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                                        {user.referee?.firstName?.[0]}{user.referee?.lastName?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 dark:text-white">
                                            {user.referee?.firstName} {user.referee?.lastName}
                                        </h3>
                                        <p className="text-xs text-zinc-500">{user.referee?.officialType || "Belirtilmemiş"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">TCKN:</span>
                                    <span className="font-mono">{user.tckn}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Telefon:</span>
                                    <span>{user.referee?.phone}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">E-posta:</span>
                                    <span className="truncate max-w-[150px]">{user.referee?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Kayıt:</span>
                                    <span>{new Date(user.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <form action={async () => { "use server"; await approveUser(user.id); }} className="flex-1">
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        <Check className="w-4 h-4" /> Onayla
                                    </button>
                                </form>
                                <form action={async () => { "use server"; await rejectUser(user.id); }} className="flex-1">
                                    <button
                                        type="submit"
                                        className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-red-50 text-zinc-600 hover:text-red-600 py-2 rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        <X className="w-4 h-4" /> Reddet
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
