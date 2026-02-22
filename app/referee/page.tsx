import Link from "next/link";
import Image from "next/image";
import { ArrowRight, CheckCircle, Clock } from "lucide-react";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { ProfileSettings } from "@/components/referee/ProfileSettings";
import { formatClassification } from "@/lib/format-utils";
import { redirect } from "next/navigation";

export default async function RefereeDashboard() {
    const session = await verifySession();
    const referee = await db.referee.findUnique({
        where: { userId: session.userId },
        include: { regions: true }
    });

    if (!referee) return <div>Profil bulunamadı.</div>;

    // Security Redirect: If NOT a REFEREE, go to official dashboard
    if (referee.officialType && referee.officialType !== 'REFEREE') {
        redirect("/general");
    }

    const displayName = `${referee.firstName} ${referee.lastName}`;
    const classificationLabel = formatClassification(referee.classification);
    // Region mock for now if many-to-many is empty, or take first
    const regionName = referee.regions.length > 0 ? referee.regions[0].name : "Bölge Yok";

    // Fetch assignments
    const assignments = await db.matchAssignment.findMany({
        where: { refereeId: referee.id },
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

    // Fetch availability forms
    const availabilityForms = await db.availabilityForm.findMany({
        where: { refereeId: referee.id },
        include: {
            days: true
        },
        orderBy: {
            weekStartDate: 'desc'
        },
        take: 5 // Last 5 forms
    });

    // Fetch week number setting
    const weekNumberSetting = await db.systemSetting.findUnique({ where: { key: "CURRENT_WEEK_NUMBER" } });

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Hoşgeldin, {referee.firstName}</h1>
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
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${referee.classification === 'BELIRLENMEMIS'
                                            ? 'bg-zinc-100 text-zinc-600'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {classificationLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <ProfileSettings currentEmail={referee.email} currentPhone={referee.phone} />
                        </div>

                        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <div>
                                <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">TC Kimlik No</label>
                                <span className="font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full">
                                    {referee.tckn.substring(0, 2)}*******{referee.tckn.substring(9)}
                                </span>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">E-posta</label>
                                <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full truncate">
                                    {referee.email}
                                </span>
                            </div>

                            {referee.phone && (
                                <div>
                                    <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">Telefon</label>
                                    <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full">
                                        {referee.phone}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* My Availabilities Section */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                            Uygunluklarım
                        </h2>

                        {availabilityForms.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 border-dashed">
                                <p className="text-zinc-500">Henüz uygunluk formu göndermediniz.</p>
                                <Link
                                    href="/referee/availability"
                                    className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                    İlk Formu Gönder
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {availabilityForms.map((form) => {
                                    const formattedDate = new Date(form.weekStartDate).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    });

                                    const totalSlots = form.days.reduce((acc, day) => {
                                        if (day.slots) {
                                            return acc + day.slots.split(',').length;
                                        }
                                        return acc;
                                    }, 0);

                                    const isSubmitted = form.status === "SUBMITTED" || form.status === "LOCKED";

                                    return (
                                        <div
                                            key={form.id}
                                            className="bg-white dark:bg-zinc-900 rounded-lg p-5 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div>
                                                    <h3 className="font-semibold text-zinc-900 dark:text-white">
                                                        {formattedDate} Haftası
                                                    </h3>
                                                    <p className="text-sm text-zinc-500">
                                                        {form.days.length} gün • {totalSlots} zaman dilimi
                                                    </p>
                                                </div>
                                                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isSubmitted
                                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                                    : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                                                    }`}>
                                                    {isSubmitted ? "Gönderildi" : "Taslak"}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                                <span>
                                                    Son güncelleme: {new Date(form.updatedAt).toLocaleDateString('tr-TR')}
                                                </span>
                                                <Link
                                                    href="/referee/availability"
                                                    className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                                >
                                                    Görüntüle
                                                    <ArrowRight className="w-3 h-3" />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
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

                        <Link href="/referee/availability" className="mt-6 flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 hover:bg-white/30 transition-colors">
                            <span className="font-semibold">Bildirim Yap</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
