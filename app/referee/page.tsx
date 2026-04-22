import Link from "next/link";
import { ArrowRight, User, Calendar, PlayCircle, ClipboardList, Sparkles, Trophy, BookOpen, Users, CheckCircle, Megaphone, Briefcase } from "lucide-react";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

const REFEREE_HUB_CARDS = [
    {
        title: "Maçlarım",
        description: "Size atanmış olan geçmiş ve gelecek tüm müsabakaları görüntüleyin.",
        href: "/referee/matches",
        icon: Sparkles,
        color: "bg-amber-600",
        badge: "YENİ"
    },
    {
        title: "Profilim",
        description: "Kişisel bilgilerinizi ve yetkinliklerinizi yönetin.",
        href: "/referee/profile",
        icon: User,
        color: "bg-red-600",
        badge: "KİŞİSEL"
    },
    {
        title: "Uygunluk Formu",
        description: "Haftalık maç takvimi için uygun olduğunuz gün ve saatleri bildirin.",
        href: "/referee/availability",
        icon: Calendar,
        color: "bg-emerald-600",
        badge: "HAFTALIK"
    },
    {
        title: "Eğitim Videoları",
        description: "Mesleki gelişiminizi sağlayacak eğitim ve bilgilendirme videolarını izleyin.",
        href: "/referee/videos",
        icon: PlayCircle,
        color: "bg-blue-600",
        badge: "EĞİTİM"
    },
    {
        title: "Hakem Çantası",
        description: "Eğitim videoları, soru havuzu ve kural kitaplarına tek noktadan erişin.",
        href: "/referee/bag",
        icon: Briefcase,
        color: "bg-purple-600",
        badge: "KARİYER"
    },

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

export default async function RefereeOverview() {
    const session = await verifySession();
    
    const isObserverAndAdmin = session.role !== "REFEREE" && ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role);

    // Prepare promises
    const userPromise = db.user.findUnique({
        where: { id: session.userId },
        select: { id: true, username: true, role: true, imageUrl: true }
    }).catch(e => {
        console.error("Error fetching user data:", e);
        return null;
    });

    let adminAnnp: any = null;
    let recentAnnp: any = null;

    if (isObserverAndAdmin) {
        adminAnnp = db.announcement.findFirst({
            where: { target: "ALL" },
            orderBy: { createdAt: "desc" }
        }).catch(e => {
            console.error("Error fetching admin announcement:", e);
            return null;
        });
    } else {
        recentAnnp = db.announcement.findMany({
            where: {
                OR: [
                    { target: "ALL" },
                    { target: "REFEREE" }
                ]
            },
            orderBy: { createdAt: "desc" },
            take: 3
        }).catch(e => {
            console.error("Error fetching recent announcements:", e);
            return [];
        });
    }

    const [user, adminAnnouncement, recentAnnouncementsResult] = await Promise.all([
        userPromise,
        adminAnnp || Promise.resolve(null),
        recentAnnp || Promise.resolve([])
    ]);

    let recentAnnouncements = recentAnnouncementsResult;
    let personalAnnouncement = null;

    if (isObserverAndAdmin) {
        const orConditions: any[] = [{ target: "OBSERVER" }];
        if (user?.username) {
            orConditions.push({ content: { contains: user.username } });
        }

        personalAnnouncement = await db.announcement.findFirst({
            where: { OR: orConditions },
            orderBy: { createdAt: "desc" }
        }).catch(e => {
            console.error("Error fetching personal announcement:", e);
            return null;
        });
    }

    return (
        <div className="space-y-12">
            <header className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 rotate-3">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                        Hakem Paneli
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] italic">OPERASYONEL KONTROL MERKEZİ</p>
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
                {REFEREE_HUB_CARDS.map((card) => (
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
                            ERİŞİM SAĞLA <ArrowRight className="w-3 h-3" />
                        </div>

                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-800/10 rounded-full blur-3xl group-hover:bg-red-600/10 transition-colors" />
                    </Link>
                ))}
            </div>



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
                            
                            <Link href="/referee/announcements" className="mt-auto w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-center font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 backdrop-blur-md border border-white/10">
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
                            
                            <Link href="/referee/announcements" className="mt-auto w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center font-bold text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-zinc-700">
                                Gelen Kutusuna Git <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

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

                    {recentAnnouncements.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {recentAnnouncements.map((ann) => (
                                <div key={ann.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-purple-500/50 hover:-translate-y-1 transition-all group flex flex-col h-full relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-colors" />
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <span className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-[9px] font-black uppercase rounded">
                                            {ann.target === "ALL" ? "Genel" : "Hakem"}
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
                                    
                                    <Link href="/referee/announcements" className="mt-auto text-[10px] font-black uppercase text-purple-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
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

            {/* Quick Promo */}
            <div className="bg-zinc-900 dark:bg-white rounded-[3rem] p-10 text-white dark:text-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                <div className="relative z-10 flex-1">
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Gelişimini Takip Et</h3>
                    <p className="text-zinc-400 dark:text-zinc-500 font-medium mb-8 max-w-md italic">Eğitimlerinizi tamamlayın, puanlarınızı yükseltin ve klasmanınızda zirveye oynayın.</p>
                    <Link href="/referee/videos" className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 uppercase">
                        VİDEOLARI İZLE <PlayCircle className="w-4 h-4" />
                    </Link>
                </div>
                <div className="hidden lg:block relative z-10">
                    <img src="/hakem/defaultHakem.png" alt="Promo" className="w-40 h-40 object-cover rounded-3xl rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl" />
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]" />
            </div>
        </div>
    );
}
