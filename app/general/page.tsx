import Link from "next/link";
import Image from "next/image";
import { ArrowRight, User, Calendar, PlayCircle, ClipboardList, Sparkles, Trophy, BookOpen, Clock, Users, CheckCircle } from "lucide-react";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { ProfileSettings } from "@/components/referee/ProfileSettings";
import { redirect } from "next/navigation";
import { PenaltyBadge } from "@/components/referee/PenaltyBadge";

const OFFICIAL_HUB_CARDS = [
    {
        title: "Profilim",
        description: "Kişisel bilgilerinizi ve görevli profilinizi yönetin.",
        href: "/general/profile",
        icon: User,
        color: "bg-red-600",
        badge: "KİŞİSEL"
    },
    {
        title: "Uygunluk Bildirimi",
        description: "Haftalık operasyon için uygunluk durumunuzu iletin.",
        href: "/general/availability",
        icon: Calendar,
        color: "bg-emerald-600",
        badge: "HAFTALIK"
    },
    {
        title: "Kural & Mevzuat",
        description: "Görevli el kitapları ve resmi dökümanlar.",
        href: "/general/rules",
        icon: BookOpen,
        color: "bg-zinc-700"
    }
];

const ADMIN_MANAGEMENT_CARDS = [
    {
        title: "Gözlemci Raporları",
        description: "Gözlemciler tarafından gönderilen tüm raporları inceleyin ve yönetin.",
        href: "/admin/observer-reports",
        icon: ClipboardList,
        color: "bg-orange-600",
        badge: "YÖNETİM"
    },
    {
        title: "Tüm Uygunluklar",
        description: "Tüm hakem ve görevli uygunluk listelerini yönetin.",
        href: "/admin/all-availabilities",
        icon: Calendar,
        color: "bg-blue-600",
        badge: "YÖNETİM"
    },
    {
        title: "Hakem Listesi",
        description: "Sistemde kayıtlı tüm hakemlerin detaylarını ve performanslarını görün.",
        href: "/admin/referees",
        icon: Users,
        color: "bg-indigo-600",
        badge: "YÖNETİM"
    },
    {
        title: "Onay Bekleyenler",
        description: "Yeni kayıt olan veya bilgi güncelleyen üyeleri onaylayın.",
        href: "/admin/approvals",
        icon: CheckCircle,
        color: "bg-emerald-600",
        badge: "YÖNETİM"
    }
];

export default async function GeneralDashboard() {
    const session = await verifySession();

    const official = await db.generalOfficial.findUnique({
        where: { userId: session.userId },
        include: {
            regions: true,
            user: { include: { penalties: true } }
        }
    });

    if (!official) {
        const referee = await db.referee.findUnique({ where: { userId: session.userId } });
        if (referee) redirect("/referee");
        return <div>Profil bulunamadı.</div>;
    }

    const assignments = await db.matchAssignment.findMany({
        where: { officialId: official.id },
        include: { match: true },
        orderBy: { match: { date: 'asc' } }
    });

    const upcomingMatches = assignments.filter(a => new Date(a.match.date) >= new Date());
    const pastMatches = assignments.filter(a => new Date(a.match.date) < new Date());

    return (
        <div className="space-y-12">
            <header className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 rotate-3">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                        Görevli Paneli
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] italic">HOŞ GELDİN, {official.firstName}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {OFFICIAL_HUB_CARDS.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="group relative bg-white dark:bg-zinc-900 border-2 border-zinc-50 dark:border-zinc-800 p-8 rounded-[2.5rem] hover:ring-2 hover:ring-red-600/50 hover:border-red-600/50 transition-all shadow-sm hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                    >
                        {card.badge && (
                            <span className="absolute top-6 right-6 px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[8px] font-black rounded-full tracking-tighter">
                                {card.badge}
                            </span>
                        )}

                        <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-${card.color.split('-')[1]}-600/20 group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-6 h-6 text-white" />
                        </div>

                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight group-hover:text-red-600 transition-colors uppercase italic">
                            {card.title}
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed italic">
                            {card.description}
                        </p>

                        <div className="mt-6 flex items-center gap-2 text-red-600 font-black text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                            YÖNLENDİR <ArrowRight className="w-3 h-3" />
                        </div>

                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-800/10 rounded-full blur-3xl group-hover:bg-red-600/10 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* Admin Management Section for IHK Admins */}
            {["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role) && (
                <div className="space-y-8 mt-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight text-red-600">Yönetim Araçları</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase italic tracking-widest">Sistem Yönetim Kısayolları</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {ADMIN_MANAGEMENT_CARDS.map((card) => (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] hover:ring-2 hover:ring-red-600/50 hover:border-red-600/50 transition-all shadow-sm overflow-hidden"
                            >
                                <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                    <card.icon className="w-5 h-5 text-white" />
                                </div>

                                <h3 className="text-sm font-black text-zinc-900 dark:text-white mb-1 tracking-tight group-hover:text-red-600 transition-colors uppercase italic">
                                    {card.title}
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-medium leading-tight italic">
                                    {card.description}
                                </p>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Assignments Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-900 dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <Clock className="w-5 h-5 text-white dark:text-zinc-900" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Atanmış Maçlar</h2>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase italic">Güncel görev dağılımı</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {upcomingMatches.length === 0 && pastMatches.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[3rem] border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                            <p className="text-zinc-500 font-bold italic">Henüz atanmış bir maçınız bulunmamaktadır.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {upcomingMatches.map((assignment) => (
                                <div key={assignment.id} className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 border border-zinc-100 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full blur-3xl" />

                                    <div className="flex justify-between items-start mb-6">
                                        <div className="px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-black rounded-full uppercase tracking-widest border border-red-200 dark:border-red-800">
                                            {assignment.match.league}
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-zinc-900 dark:text-white">{new Date(assignment.match.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</div>
                                            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{new Date(assignment.match.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>

                                    <h4 className="text-xl font-black text-zinc-900 dark:text-white mb-4 uppercase italic tracking-tight leading-tight">
                                        {assignment.match.homeTeam} <span className="text-red-600">v</span> {assignment.match.awayTeam}
                                    </h4>

                                    <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 text-zinc-500 font-bold text-[10px] uppercase tracking-wider italic">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            {assignment.match.location}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black text-zinc-400 uppercase block mb-1">GÖREV</span>
                                            <span className="text-xs font-black text-red-600 uppercase tracking-tighter">{assignment.role}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
