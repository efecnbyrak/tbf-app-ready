import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { History, User as UserIcon, Activity, Globe, Clock, ShieldAlert } from "lucide-react";
import { ensureAuditLogTable } from "@/lib/logger";
import { LogsClient } from "./LogsClient";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ startDate?: string; endDate?: string }>;
}

export default async function AuditLogsPage({ searchParams }: PageProps) {
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const params = await searchParams;
    const { startDate, endDate } = params;

    // ENSURE TABLE EXISTS
    await ensureAuditLogTable();

    let logs: any[] = [];
    try {
        const where: any = {};
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }

        logs = await (db as any).auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 200, // Increase limit when filtering
            include: {
                user: {
                    select: {
                        username: true,
                        referee: {
                            select: {
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("[AUDIT LOG ERROR] Prisma fetch failed, trying raw SQL:", error);
        try {
            let query = `
                SELECT 
                    a.id, a.action, a.details, a."targetId", a."ipAddress", a."createdAt", a."userId",
                    u.username,
                    r."firstName", r."lastName"
                FROM audit_logs a
                LEFT JOIN users u ON a."userId" = u.id
                LEFT JOIN referees r ON u.id = r."userId"
                WHERE 1=1
            `;

            if (startDate) query += ` AND a."createdAt" >= '${new Date(startDate).toISOString()}'`;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query += ` AND a."createdAt" <= '${end.toISOString()}'`;
            }

            query += ` ORDER BY a."createdAt" DESC LIMIT 200`;

            logs = await db.$queryRawUnsafe(query);

            // Map raw results to the expected format for UI
            logs = logs.map((l: any) => ({
                ...l,
                user: l.username ? {
                    username: l.username,
                    referee: l.firstName ? { firstName: l.firstName, lastName: l.lastName } : null
                } : null
            }));
        } catch (rawError) {
            console.error("[AUDIT LOG ERROR] Raw fallback failed:", rawError);
        }
    }

    const getActionColor = (action: string) => {
        if (action.includes("LOGIN")) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20";
        if (action.includes("PASSWORD")) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
        if (action.includes("PROMOTE") || action.includes("DELETE")) return "text-rose-600 bg-rose-50 dark:bg-rose-900/20";
        return "text-zinc-600 bg-zinc-50 dark:bg-zinc-900/20";
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                        <History className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Sistem İşlem Kayıtları</h1>
                        <p className="text-sm text-zinc-500 font-bold uppercase italic">Son 100 işlem günlüğü</p>
                    </div>
                </div>
                <LogsClient />
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-zinc-50 dark:bg-zinc-950/50 text-zinc-500 uppercase text-[10px] font-black tracking-widest border-b border-zinc-100 dark:border-zinc-800">
                                <th className="px-6 py-5">İşlem</th>
                                <th className="px-6 py-5">Kullanıcı</th>
                                <th className="px-6 py-5">Detay</th>
                                <th className="px-6 py-5">IP Adresi</th>
                                <th className="px-6 py-5">Tarih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-medium">
                            {logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-2 opacity-20">
                                            <ShieldAlert className="w-12 h-12" />
                                            <p className="uppercase font-black italic">Henüz kayıt bulunmuyor</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                                                    <UserIcon className="w-4 h-4 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <p className="text-zinc-900 dark:text-zinc-100 truncate max-w-[150px]">
                                                        {log.user?.referee ? `${log.user.referee.firstName} ${log.user.referee.lastName}` : (log.user?.username || "Sistem")}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-500 font-bold">UID: {log.userId || "-"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 max-w-xs truncate italic">
                                            {log.details || "-"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Globe className="w-3 h-3 text-zinc-400" />
                                                <span className="font-mono text-xs">{log.ipAddress || "Bilinmiyor"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-zinc-500">
                                                <Clock className="w-3 h-3 text-zinc-400" />
                                                <span className="text-[10px] font-bold">
                                                    {new Date(log.createdAt).toLocaleString('tr-TR', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
