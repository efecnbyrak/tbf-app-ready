import Link from "next/link";
import { ArrowRight, User, Calendar, PlayCircle, ClipboardList, Sparkles, Trophy, BookOpen, Users, CheckCircle } from "lucide-react";
import { verifySession } from "@/lib/session";

const REFEREE_HUB_CARDS = [
    {
        title: "Profilim",
        description: "Kişisel bilgilerinizi, yetkinliklerinizi ve atama kısıtlamalarınızı yönetin.",
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
        title: "Kural Kitabı",
        description: "Resmi kurallar ve hakem el kitaplarına buradan erişin.",
        href: "/referee/rules",
        icon: BookOpen,
        color: "bg-zinc-700"
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

            {/* Admin Management Section for IHK Admins */}
            {["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role) && (
                <div className="space-y-8">
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
