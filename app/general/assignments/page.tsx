import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { Calendar, MapPin, Divide } from "lucide-react";
import { redirect } from "next/navigation"; // Added redirect import
import Link from "next/link"; // Added Link import
import { ArrowRight } from "lucide-react"; // Added ArrowRight import

export default async function OfficialAssignmentsPage() {
    const session = await verifySession();
    // Assuming session has correct user ID.
    // We can fetch referee details again or trust the session user mapping if simple

    // We need refereeID
    const referee = await db.referee.findUnique({
        where: { userId: session.userId }
    });

    // Security Redirect: If actually a REFEREE, go to referee dashboard
    if (referee && referee.officialType === 'REFEREE') { // Added check for referee existence
        redirect("/referee");
    }

    if (!referee) return <div>Profil bulunamadı.</div>;

    const assignments = await db.matchAssignment.findMany({
        where: { refereeId: referee.id },
        include: {
            match: true
        },
        orderBy: {
            match: {
                date: 'desc'
            }
        }
    });

    const upcoming = assignments.filter(a => new Date(a.match.date) >= new Date());
    const past = assignments.filter(a => new Date(a.match.date) < new Date());

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Görevlerim</h1>
                <p className="text-zinc-500">
                    Atanmış olduğunuz maçların listesi.
                </p>
            </header>

            {assignments.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border dashed">
                    <p className="text-zinc-500">Henüz atanmış bir maçınız bulunmamaktadır.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Upcoming */}
                    {upcoming.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Yaklaşan Maçlar
                            </h2>
                            {upcoming.map(item => (
                                <AssignmentCard key={item.id} assignment={item} />
                            ))}
                        </div>
                    )}

                    {/* Past */}
                    {past.length > 0 && (
                        <div className="space-y-4 opacity-75">
                            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-zinc-400 rounded-full"></span>
                                Tamamlanan Maçlar
                            </h2>
                            {past.map(item => (
                                <AssignmentCard key={item.id} assignment={item} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function AssignmentCard({ assignment }: { assignment: any }) {
    const match = assignment.match;
    const date = new Date(match.date);

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg text-center min-w-[70px]">
                        <div className="text-xs text-zinc-500 uppercase font-bold">{date.toLocaleDateString('tr-TR', { month: 'short' })}</div>
                        <div className="text-2xl font-bold text-zinc-900 dark:text-white">{date.getDate()}</div>
                        <div className="text-xs text-zinc-400">{date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>

                    <div>
                        <div className="text-sm font-semibold text-red-600 mb-1">{match.league}</div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                            {match.homeTeam} vs {match.awayTeam}
                        </h3>
                        <Link href="/general/availability" className="mt-6 flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 hover:bg-white/30 transition-colors">
                            <span className="font-semibold">Bildirim Yap</span>
                            <ArrowRight size={18} />
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                            <MapPin size={14} />
                            {match.location}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 pl-4 border-l border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 uppercase font-medium">Göreviniz</span>
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-bold">
                        {assignment.role}
                    </span>
                </div>
            </div>
        </div>
    );
}
