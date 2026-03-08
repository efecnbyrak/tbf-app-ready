"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface RecentRegistrationsProps {
    latestRegistrations: any[];
}

export function RecentRegistrations({ latestRegistrations }: RecentRegistrationsProps) {
    const router = useRouter();

    return (
        <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-black text-zinc-900 dark:text-white">Son Kayıt Olanlar</h2>
                <Link href="/admin/referees" className="text-sm text-red-600 hover:text-red-700 font-medium">Tümünü Gör</Link>
            </div>

            {/* Desktop View (Table) */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 uppercase text-xs font-bold">
                        <tr>
                            <th className="px-6 py-4">Ad Soyad</th>
                            <th className="px-6 py-4">Görev/Klasman</th>
                            <th className="px-6 py-4">TCKN</th>
                            <th className="px-6 py-4">Kayıt Tarihi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {latestRegistrations.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                                    Henüz kayıtlı kullanıcı yok.
                                </td>
                            </tr>
                        ) : (
                            latestRegistrations.map((user: any) => {
                                const maskedTckn = user.tckn
                                    ? `${user.tckn.substring(0, 2)}*******${user.tckn.substring(9)}`
                                    : '***********';

                                const roleLabels: Record<string, string> = {
                                    "REFEREE": "Hakem",
                                    "TABLE": "Masa Görevlisi",
                                    "OBSERVER": "Gözlemci",
                                    "HEALTH": "Sağlıkçı",
                                    "STATISTICIAN": "İstatistikçi",
                                    "TABLE_STATISTICIAN": "Masa & İstatistik",
                                    "TABLE_HEALTH": "Masa & Sağlık",
                                    "FIELD_COMMISSIONER": "Saha Komiseri"
                                };
                                const roleLabel = roleLabels[user.officialType || ""] || user.officialType || "Belirsiz";

                                const targetPage = user.officialType === "REFEREE" ? "/admin/referees" : "/admin/officials";
                                const searchUrl = `${targetPage}?search=${user.tckn}`;

                                return (
                                    <tr
                                        key={user.id}
                                        onClick={() => router.push(searchUrl)}
                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-3 font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors">
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${user.officialType === 'REFEREE'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {roleLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-zinc-600 dark:text-zinc-400">
                                            {maskedTckn}
                                        </td>
                                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400 font-medium">
                                            {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
                {latestRegistrations.length === 0 ? (
                    <div className="px-6 py-8 text-center text-zinc-500">
                        Henüz kayıtlı kullanıcı yok.
                    </div>
                ) : (
                    latestRegistrations.map((user) => {
                        const maskedTckn = user.tckn
                            ? `${user.tckn.substring(0, 2)}*******${user.tckn.substring(9)}`
                            : '***********';

                        const roleLabels: Record<string, string> = {
                            "REFEREE": "Hakem",
                            "TABLE": "Masa Görevlisi",
                            "OBSERVER": "Gözlemci",
                            "HEALTH": "Sağlıkçı",
                            "STATISTICIAN": "İstatistikçi",
                            "TABLE_STATISTICIAN": "Masa & İstatistik",
                            "TABLE_HEALTH": "Masa & Sağlık",
                            "FIELD_COMMISSIONER": "Saha Komiseri"
                        };
                        const roleLabel = roleLabels[user.officialType || ""] || user.officialType || "Belirsiz";

                        const targetPage = user.officialType === "REFEREE" ? "/admin/referees" : "/admin/officials";
                        const searchUrl = `${targetPage}?search=${user.tckn}`;

                        return (
                            <div
                                key={user.id}
                                onClick={() => router.push(searchUrl)}
                                className="p-4 space-y-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors">
                                        {user.firstName} {user.lastName}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.officialType === 'REFEREE'
                                        ? 'bg-red-100 text-red-700'
                                        : 'bg-orange-100 text-orange-700'
                                        }`}>
                                        {roleLabel}
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500">
                                    <span className="font-mono">{maskedTckn}</span>
                                    <span>
                                        {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
