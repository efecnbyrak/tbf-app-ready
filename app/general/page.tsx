
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock } from "lucide-react";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { ProfileSettings } from "@/components/referee/ProfileSettings";
import { redirect } from "next/navigation";

export default async function GeneralDashboard() {
    const session = await verifySession();

    // First check generalOfficial table
    const official = await db.generalOfficial.findUnique({
        where: { userId: session.userId },
        include: { regions: true }
    });

    if (!official) {
        // Not an official, check if they are a referee
        const referee = await db.referee.findUnique({
            where: { userId: session.userId }
        });
        if (referee) {
            redirect("/referee");
        }
        return <div>Profil bulunamadı.</div>;
    }

    const displayName = `${official.firstName} ${official.lastName}`;
    const realOfficialType = official.officialType;

    // Label for the official role
    const typeLabels: Record<string, string> = {
        "TABLE": "Masa Görevlisi",
        "OBSERVER": "Gözlemci",
        "HEALTH": "Sağlıkçı",
        "STATISTICIAN": "İstatistikçi",
        "FIELD_COMMISSIONER": "Saha Komiseri",
        "TABLE_STATISTICIAN": "Masa & İstatistik",
        "TABLE_HEALTH": "Masa & Sağlık",
        "REFEREE": "Hakem"
    };

    const officialRoleLabel = typeLabels[realOfficialType!] || realOfficialType || "Görevli";

    // Fetch assignments
    const assignments = await db.matchAssignment.findMany({
        where: { officialId: official.id },
        include: {
            match: true
        },
        orderBy: {
            match: {
                date: 'asc'
            }
        }
    });

    const upcomingMatches = assignments.filter(a => new Date(a.match.date) >= new Date());
    const pastMatches = assignments.filter(a => new Date(a.match.date) < new Date());

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Hoşgeldin, {official.firstName}</h1>
                <p className="text-zinc-500 mt-2">Güncel durumun ve bildirimlerin</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content Column */}
                <div className="md:col-span-2 space-y-8">

                    {/* Profile Card */}
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-start gap-6">
                        <div className="w-full flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700">
                                    <Image
                                        src="/hakem/defaultHakem.png"
                                        alt={displayName}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold">{displayName}</h2>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                                            {officialRoleLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ProfileSettings currentEmail={official.email} currentPhone={official.phone} />
                        </div>

                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">TC Kimlik No</label>
                                <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full">
                                    {official.tckn.substring(0, 2)}*******{official.tckn.substring(9)}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">E-posta</label>
                                <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full truncate">
                                    {official.email}
                                </span>
                            </div>

                            {official.phone && (
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">Telefon</label>
                                    <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full">
                                        {official.phone}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Assigned Matches Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Görev Aldığınız Maçlar
                        </h2>

                        {upcomingMatches.length === 0 && pastMatches.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                                <p className="text-zinc-500">Henüz atanmış bir maçınız bulunmamaktadır.</p>
                            </div>
                        ) : (
                            <>
                                {/* Upcoming */}
                                {upcomingMatches.length > 0 && (
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Yaklaşan Maçlar</h3>
                                        <div className="grid gap-4">
                                            {upcomingMatches.map((assignment) => (
                                                <div key={assignment.id} className="bg-white dark:bg-zinc-900 rounded-lg p-5 border-l-4 border-red-600 shadow-sm border-y border-r border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:shadow-md">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-1">
                                                            <span>{assignment.match.league}</span>
                                                            <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                                            <span>{new Date(assignment.match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
                                                            <span className="w-1 h-1 bg-zinc-300 rounded-full"></span>
                                                            <span>{new Date(assignment.match.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                        <div className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                                                            {assignment.match.homeTeam} vs {assignment.match.awayTeam}
                                                        </div>
                                                        <div className="text-zinc-500 text-sm flex items-center gap-1">
                                                            {/* Location Icon SVG */}
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                            {assignment.match.location}
                                                        </div>
                                                    </div>

                                                    <div className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-lg text-center min-w-[140px]">
                                                        <div className="text-xs text-zinc-500 uppercase">Göreviniz</div>
                                                        <div className="font-bold text-red-700">{assignment.role}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Past */}
                                {pastMatches.length > 0 && (
                                    <div className="space-y-4 opacity-75">
                                        <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Geçmiş Maçlar</h3>
                                        <div className="grid gap-4">
                                            {pastMatches.map((assignment) => (
                                                <div key={assignment.id} className="bg-gray-50 dark:bg-zinc-900/50 rounded-lg p-5 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 grayscale transition hover:grayscale-0">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 text-zinc-500 font-bold text-sm mb-1">
                                                            <span>{assignment.match.league}</span>
                                                            <span>•</span>
                                                            <span>{new Date(assignment.match.date).toLocaleDateString('tr-TR')}</span>
                                                        </div>
                                                        <div className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                                                            {assignment.match.homeTeam} - {assignment.match.awayTeam}
                                                        </div>
                                                    </div>
                                                    <div className="text-sm text-zinc-500">
                                                        {assignment.role}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-red-700 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all h-full max-h-[300px]">
                        <div className="absolute right-[-20px] top-[-20px] opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform">
                            <Clock size={120} />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-1">Uygunluk Bildirimi</h3>
                            <p className="text-red-100 text-sm opacity-90">Bu haftaki maç programı için uygunluk durumunu bildir.</p>
                        </div>

                        <Link href="/general/availability" className="mt-6 flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 hover:bg-white/30 transition-colors">
                            <span className="font-semibold">Bildirim Yap</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
