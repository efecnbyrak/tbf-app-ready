import Link from "next/link";
import {
    Users,
    Calendar,
    MessageSquare,
    FileText,
    ShieldCheck,
    Database,
    Bell,
    Settings,
    ArrowRight,
    Sparkles,
    BarChart3,
    History,
    CheckCircle,
    Briefcase,
    User,
    Trophy,
    BookOpen,
    Video
} from "lucide-react";

interface HubCard {
    title: string;
    description: string;
    href: string;
    icon: any;
    color: string;
    badge?: string;
    showFor?: string[];
}

const ADMIN_HUB_CARDS: HubCard[] = [
    {
        title: "Hakem Yönetimi",
        description: "Klasmanları düzenle, aktiflik durumlarını yönet ve detaylı ara.",
        href: "/admin/referees",
        icon: Users,
        color: "bg-blue-600",
        badge: "YÖNETİM"
    },
    {
        title: "Genel Görevliler",
        description: "BKG listesini yönet ve görevli detaylarını incele.",
        href: "/admin/officials",
        icon: ShieldCheck,
        color: "bg-indigo-600",
        badge: "YÖNETİM"
    },
    {
        title: "Onay Bekleyenler",
        description: "Yeni kayıt başvurularını ve klasman güncellemelerini onayla.",
        href: "/admin/approvals",
        icon: CheckCircle,
        color: "bg-red-600",
        badge: "KONTROL"
    },
    {
        title: "Tüm Uygunluklar",
        description: "Haftalık uygunluk listelerini incele ve Excel çıktıları al.",
        href: "/admin/all-availabilities",
        icon: Database,
        color: "bg-blue-500",
        badge: "EXCEL"
    },

    {
        title: "Gözlemci Raporları",
        description: "Gözlemciler tarafından iletilen saha ve hakem raporları.",
        href: "/admin/observer-reports",
        icon: FileText,
        color: "bg-amber-600",
        badge: "YENİ"
    },
    {
        title: "Duyuru Sistemi",
        description: "Sistem genelinde veya role özel duyurular yayınla.",
        href: "/admin/announcements",
        icon: Bell,
        color: "bg-purple-600"
    },
    {
        title: "Hakem Çantası",
        description: "Eğitim videolarını, soru havuzunu ve kural kitaplarını buradan yönetin.",
        href: "/admin/bag",
        icon: Briefcase,
        color: "bg-red-500",
        badge: "İÇERİK"
    },


    {
        title: "İşlem Günlükleri",
        description: "Sistemde yapılan tüm kritik işlemlerin audit kayıtları.",
        href: "/admin/logs",
        icon: History,
        color: "bg-zinc-600",
        showFor: ["SUPER_ADMIN"]
    }
];

export default function AdminHub({ role, pendingCount = 0, hasReferee = false, hasOfficial = false }: { role?: string, pendingCount?: number, hasReferee?: boolean, hasOfficial?: boolean }) {
    let filteredCards = ADMIN_HUB_CARDS.filter(card => {
        return !card.showFor || (role && card.showFor.includes(role));
    });

    if ((hasReferee || hasOfficial) && role !== "SUPER_ADMIN") {
        filteredCards = [
            {
                title: "Kişisel Görev Paneli",
                description: "Kendi görevli/hakem profilinize ve atanmış maçlarınıza erişin.",
                href: hasReferee ? "/referee" : "/general",
                icon: ShieldCheck,
                color: "bg-orange-600",
                badge: hasReferee ? "HAKEM" : "GÖREVLİ"
            },
            ...filteredCards
        ];
    }

    return (
        <div className="space-y-12 mt-16 md:mt-20">
            <header className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 rotate-3">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                        Yönetim Üssü
                    </h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] italic">SİSTEM KONTROL PANELİ</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="group relative bg-white dark:bg-zinc-900 border-2 border-zinc-50 dark:border-zinc-800 p-8 rounded-[2.5rem] hover:ring-2 hover:ring-red-600/50 hover:border-red-600/50 transition-all shadow-sm hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                    >
                        {card.badge && !(card.title === "Onay Bekleyenler" && pendingCount > 0) && (
                            <span className="absolute top-6 right-6 px-3 py-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[8px] font-black rounded-full tracking-tighter">
                                {card.badge}
                            </span>
                        )}

                        {/* Special Notification Badge for Pending Approvals */}
                        {card.title === "Onay Bekleyenler" && pendingCount > 0 && (
                            <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black rounded-full border border-red-200 dark:border-red-800 shadow-sm animate-pulse">
                                <Bell className="w-3 h-3" />
                                {pendingCount} YENİ
                            </div>
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
                            YÖNETİME GİT <ArrowRight className="w-3 h-3" />
                        </div>

                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-zinc-50 dark:bg-zinc-800/10 rounded-full blur-3xl group-hover:bg-red-600/10 transition-colors" />
                    </Link>
                ))}
            </div>

            {/* System Status Summary */}
            {role === "SUPER_ADMIN" && (
                <div className="bg-zinc-900 dark:bg-white rounded-[3rem] p-10 text-white dark:text-zinc-900 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                    <div className="relative z-10 flex-1">
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase mb-2">Hızlı Ayarlar</h3>
                        <p className="text-zinc-400 dark:text-zinc-500 font-medium mb-8 max-w-md italic">Sistem parametrelerini, lig tanımlarını ve genel site ayarlarını buradan yapılandırın.</p>
                        <Link href="/admin/settings" className="inline-flex items-center gap-3 bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/20 active:scale-95 uppercase">
                            AYARLARA GİT <Settings className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="hidden lg:block relative z-10">
                        <div className="w-40 h-40 bg-zinc-800 dark:bg-zinc-100 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl">
                            <BarChart3 className="w-20 h-20 text-red-600 opacity-20" />
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/10 rounded-full blur-[100px]" />
                </div>
            )}
        </div>
    );
}
