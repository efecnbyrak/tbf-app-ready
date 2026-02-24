
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { UserPlus, Shield, Trash2, Key } from "lucide-react";
import { CreateAdminForm } from "./CreateAdminForm";

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
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-red-600" />
                    Yönetici Yönetimi
                </h1>
                <p className="text-zinc-500 mt-2">
                    Yeni yöneticiler ekleyin ve mevcut yöneticileri görüntüleyin.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Admin Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm sticky top-8">
                        <div className="flex items-center gap-2 mb-6">
                            <UserPlus className="w-5 h-5 text-red-600" />
                            <h2 className="text-xl font-bold">Yeni Yönetici Ekle</h2>
                        </div>
                        <CreateAdminForm />
                    </div>
                </div>

                {/* Admin List */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                            <h2 className="font-bold text-zinc-900 dark:text-white">Sistem Yöneticileri</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 uppercase text-xs font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Kullanıcı Adı / TCKN</th>
                                        <th className="px-6 py-4">Rol</th>
                                        <th className="px-6 py-4">Kayıt Tarihi</th>
                                        <th className="px-6 py-4 text-right">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {admins.map((admin) => (
                                        <tr key={admin.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                        <Key className="w-4 h-4 text-zinc-400" />
                                                    </div>
                                                    <span className="font-medium">{admin.tckn}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${admin.role.name === "SUPER_ADMIN"
                                                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                    }`}>
                                                    {admin.role.name === "SUPER_ADMIN" ? "Süper Admin" : "Yönetici"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-zinc-500">
                                                {new Date(admin.createdAt).toLocaleDateString('tr-TR')}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {admin.role.name !== "SUPER_ADMIN" && (
                                                    <button className="p-2 text-zinc-400 hover:text-red-600 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
