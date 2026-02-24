
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserPlus, Shield, Trash2, Key } from "lucide-react";
import { CreateAdminForm } from "./CreateAdminForm";
import { AdminRow } from "./AdminRow";

export const dynamic = 'force-dynamic';

export default async function ManageAdminsPage() {
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    // Fetch all admins (Role = ADMIN or SUPER_ADMIN)
    const admins = await db.user.findMany({
        where: {
            role: {
                name: { in: ["ADMIN", "SUPER_ADMIN"] }
            }
        },
        include: {
            role: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="space-y-8">
            <header>
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                        <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                            Admin Yönetici Paneli
                        </h1>
                        <p className="text-zinc-500 font-medium">
                            Sistem yöneticilerini ekleyin, yetkilendirin ve yönetin.
                        </p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Admin Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border-2 border-zinc-100 dark:border-zinc-800 shadow-xl sticky top-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                                <UserPlus className="w-5 h-5 text-red-600" />
                            </div>
                            <h2 className="text-xl font-black tracking-tight">Yeni Yönetici Ekle</h2>
                        </div>
                        <CreateAdminForm />
                    </div>
                </div>

                {/* Admin List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-widest text-sm">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            Aktif Yöneticiler ({admins.length})
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {admins.map((admin) => (
                            <AdminRow
                                key={admin.id}
                                admin={admin}
                                isCurrentUser={session?.userId === admin.id}
                            />
                        ))}
                    </div>

                    {admins.length === 0 && (
                        <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                            <p className="text-zinc-400 font-medium italic">Kayıtlı yönetici bulunamadı.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
