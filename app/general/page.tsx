import Link from "next/link";
import Image from "next/image";
import { ArrowRight, User, Calendar, PlayCircle, ClipboardList, Sparkles, Trophy, BookOpen, Clock, Users, CheckCircle, Megaphone } from "lucide-react";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { ProfileSettings } from "@/components/referee/ProfileSettings";
import { redirect } from "next/navigation";
import { PenaltyBadge } from "@/components/referee/PenaltyBadge";

const OFFICIAL_HUB_CARDS = [
    {
        title: "Maçlarım",
        description: "Size atanmış olan geçmiş ve gelecek tüm müsabakaları görüntüleyin.",
        href: "/general/matches",
        icon: Trophy,
        color: "bg-amber-600",
        badge: "YENİ"
    },
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
    },
    {
        title: "Soru Havuzu",
        description: "Kuralları pekiştirmek için örnek soruları inceleyin ve doğru cevapları öğrenin.",
        href: "/general/questions",
        icon: Trophy,
        color: "bg-amber-500",
        badge: "EĞİTİM"
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
        select: {
            id: true,
            firstName: true,
            lastName: true,
            officialType: true,
            regions: { select: { id: true, name: true } },
            user: { 
                select: { 
                    id: true, 
                    username: true, 
                    penalties: { select: { id: true, type: true, isActive: true } } 
                } 
            }
        }
    });

    if (!official) {
        const referee = await db.referee.findUnique({ where: { userId: session.userId } });
        if (referee) redirect("/referee");
        return <div>Profil bulunamadı.</div>;
    }

    const isObserverAndAdmin = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role);

    // Prepare all dependent promises to run concurrently
    const assignmentsPromise = db.matchAssignment.findMany({
        where: { officialId: official.id },
        include: { match: true },
        orderBy: { match: { date: 'asc' } }
    }).catch(e => {
        console.error("Error fetching match assignments:", e);
        return [];
    });

    const userGroups = ["ALL", "OFFICIAL"];
    if (official.officialType === "Gözlemci") userGroups.push("OBSERVER");
    else userGroups.push("TABLE");

    const activeAssignmentsPromise = db.examAssignment.findMany({
        where: {
            isActive: true,
            OR: userGroups.map(group => ({
                targetGroups: { contains: group }
            }))
        },
        include: {
            attempts: {
                where: { officialId: official.id },
                take: 1
            }
        }
    }).catch(e => {
        console.error("Error fetching exam assignments (table might not exist):", e);
        return [];
    });

    let adminAnnouncementPromise: any = null;
    let personalAnnouncementPromise: any = null;
    let recentDashboardAnnouncementsPromise: any = null;

    if (isObserverAndAdmin) {
        adminAnnouncementPromise = db.announcement.findFirst({
            where: { target: "ALL" },
            orderBy: { createdAt: "desc" }
        }).catch(e => {
            console.error("Error fetching admin announcement:", e);
            return null;
        });

        const orConditions: any[] = [{ target: "OBSERVER" }];
        if (official.user.username) {
            orConditions.push({ content: { contains: official.user.username } });
        }

        personalAnnouncementPromise = db.announcement.findFirst({
            where: { OR: orConditions },
            orderBy: { createdAt: "desc" }
        }).catch(e => {
            console.error("Error fetching personal announcement:", e);
            return null;
        });
    } else {
        let officialTarget = "ALL";
        if (official.officialType === "Masa Görevlisi") officialTarget = "TABLE";
        else if (official.officialType === "İstatistikçi") officialTarget = "STATISTICIAN";
        else if (official.officialType === "Sağlık Görevlisi") officialTarget = "HEALTH";
        else if (official.officialType === "Saha Komiseri") officialTarget = "FIELD_COMMISSIONER";
        
        recentDashboardAnnouncementsPromise = db.announcement.findMany({
            where: {
                OR: [
                    { target: "ALL" },
                    { target: officialTarget }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 3
        }).catch(e => {
            console.error("Error fetching recent announcements:", e);
            return [];
        });
    }

    const [
        assignments,
        activeAssignmentsResult,
        adminAnnouncement,
        personalAnnouncement,
        recentDashboardAnnouncementsResult
    ] = await Promise.all([
        assignmentsPromise,
        activeAssignmentsPromise,
        adminAnnouncementPromise || Promise.resolve(null),
        personalAnnouncementPromise || Promise.resolve(null),
        recentDashboardAnnouncementsPromise || Promise.resolve([])
    ]);

    const activeAssignments = activeAssignmentsResult || [];
    let recentDashboardAnnouncements = recentDashboardAnnouncementsResult;

    const upcomingMatches = assignments.filter(a => new Date(a.match.date) >= new Date());
    const pastMatches = assignments.filter(a => new Date(a.match.date) < new Date());

    let pendingHomeworks = 0;
    try {
        pendingHomeworks = activeAssignments.filter(a => a.attempts.length === 0).length;
    } catch (e: any) {
        console.error("Error calculating pending assignments:", e);
    }

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
                {isObserverAndAdmin && (
                    <div className="ml-auto">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-red-600/25 active:scale-95"
                        >
                            Yönetim Merkezine Geç <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}
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

                        {/* Notification Badge */}
                        {card.title === "Soru Havuzu" && pendingHomeworks > 0 && (
                            <div className="absolute top-6 right-6 lg:right-auto lg:left-6 bg-red-600 text-white px-2 py-1 rounded-full shadow-lg shadow-red-600/30 animate-pulse flex items-center justify-center gap-1 z-10">
                                <span className="bg-white text-red-600 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-red-600">
                                    {pendingHomeworks}
                                </span>
                                <span className="text-[10px] uppercase font-black tracking-widest leading-none">Ödev</span>
                            </div>
                        )}

                        <div className="mt-6 flex items-center gap-2 text-red-600 font-black text-[10px] tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                            YÖNLENDİR <ArrowRight className="w-3 h-3" />
                        </div>

                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-800/10 rounded-full blur-3xl group-hover:bg-red-600/10 transition-colors" />
                    </Link>
                ))}
            </div>



            {!isObserverAndAdmin && (
                <div className="mt-12 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                            <Megaphone className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight text-purple-600">En Son Duyurular</h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase italic tracking-widest">Sistemden Gelen Genel Mesajlar</p>
                        </div>
                    </div>

                    {recentDashboardAnnouncements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentDashboardAnnouncements.map((ann) => (
                                <div key={ann.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-purple-500/50 hover:-translate-y-1 transition-all group flex flex-col h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-colors" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-[9px] font-black uppercase rounded">
                                            {ann.target === "ALL" ? "Genel" : "Görevli"}
                                        </span>
                                        <span className="text-[10px] font-bold text-zinc-400 italic">
                                            {new Date(ann.createdAt).toLocaleDateString("tr-TR")}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-zinc-900 dark:text-white mb-2 leading-snug group-hover:text-purple-600 transition-colors">{ann.subject}</h3>
                                    <div 
                                        className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 mb-4 flex-1 whitespace-pre-wrap prose prose-sm dark:prose-invert prose-p:my-0 prose-headings:text-xs prose-headings:my-0"
                                        dangerouslySetInnerHTML={{ __html: ann.content }}
                                    />
                                    
                                    <Link href="/general/announcements" className="mt-auto text-[10px] font-black uppercase text-purple-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                        Tümünü Gör <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 text-center">
                            <Megaphone className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                            <p className="text-xs font-bold text-zinc-500 uppercase italic">Şu an için yeni bir duyuru bulunmamaktadır.</p>
                        </div>
                    )}
                </div>
            )}

            {isObserverAndAdmin && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Admin Announcement */}
                    <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col h-full hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/20 rounded-full blur-2xl" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                    <Megaphone className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Sistem Admin Duyurusu</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Genel Bilgilendirme</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-black/20 rounded-2xl p-6 backdrop-blur-sm border border-white/10 mb-6">
                                {adminAnnouncement ? (
                                    <>
                                        <h4 className="font-bold mb-3 text-lg">{adminAnnouncement.subject}</h4>
                                        <div 
                                            className="text-sm opacity-90 leading-relaxed max-h-40 overflow-y-auto modern-scrollbar pr-2 whitespace-pre-wrap prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2"
                                            dangerouslySetInnerHTML={{ __html: adminAnnouncement.content }}
                                        />
                                    </>
                                ) : (
                                    <p className="text-sm opacity-70 italic text-center py-8">Şu an için aktif bir admin duyurusu bulunmamaktadır.</p>
                                )}
                            </div>
                            
                            <Link href="/general/announcements" className="mt-auto w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-center font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 backdrop-blur-md border border-white/10">
                                Tüm Duyurular <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Personal / Observer Announcement */}
                    <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl flex flex-col h-full hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-purple-600/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-purple-500/20 shrink-0">
                                    <User className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight">Kişisel Duyuru</h3>
                                    <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Gözlemci & Şahsi Bildirimler</p>
                                </div>
                            </div>
                            
                            <div className="flex-1 bg-black/40 rounded-2xl p-6 backdrop-blur-sm border border-white/5 mb-6">
                                {personalAnnouncement ? (
                                    <>
                                        <h4 className="font-bold mb-3 text-lg text-purple-300">{personalAnnouncement.subject}</h4>
                                        <div 
                                            className="text-sm text-zinc-400 leading-relaxed max-h-40 overflow-y-auto modern-scrollbar pr-2 whitespace-pre-wrap prose prose-sm dark:prose-invert prose-p:my-1 prose-headings:my-2"
                                            dangerouslySetInnerHTML={{ __html: personalAnnouncement.content }}
                                        />
                                    </>
                                ) : (
                                    <p className="text-sm text-zinc-500 italic text-center py-8">Size özel bir duyuru bulunmamaktadır.</p>
                                )}
                            </div>
                            
                            <Link href="/general/announcements" className="mt-auto w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-zinc-700">
                                Gelen Kutusuna Git <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
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
