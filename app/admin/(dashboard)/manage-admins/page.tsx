import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
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
                name: { in: ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"] }
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
                    <div className="w-14 h-14 bg-zinc-900 dark:bg-zinc-100 rounded-[1.25rem] flex items-center justify-center shadow-xl">
                        <Shield className="w-8 h-8 text-white dark:text-zinc-900" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tighter italic uppercase">
                            Yönetici Kadrosu
                        </h1>
                        <p className="text-zinc-500 font-medium">
                            Sistem üzerinde tam yetkiye sahip yönetici ve süper yöneticiler.
                        </p>
                    </div>
                </div>
            </header>


            <div className="max-w-4xl mx-auto space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-[0.2em] text-[10px] italic">
                        <span className="w-2 h-2 bg-red-600 rounded-full" />
                        AKTİF YÖNETİCİLER ({admins.length})
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-2">
                    {admins.map((admin) => (
                        <AdminRow
                            key={admin.id}
                            admin={admin}
                            isCurrentUser={session?.userId === admin.id}
                        />
                    ))}
                </div>

                {admins.length === 0 && (
                    <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-900/50 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <p className="text-zinc-400 font-black uppercase tracking-widest italic">Kayıtlı yönetici bulunamadı.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
