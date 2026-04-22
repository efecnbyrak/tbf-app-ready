import { PlayCircle, Trophy, BookOpen, ArrowRight, Briefcase, Sparkles } from "lucide-react";
import Link from "next/link";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export default async function AdminBagPage() {
    const session = await verifySession();
    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { official: true }
    });

    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isObserverAdmin = (session.role === "ADMIN" || session.role === "ADMIN_IHK") && user?.official?.officialType === "OBSERVER";
    const canSeeSoruHavuzu = isSuperAdmin || isObserverAdmin;

    const managementItems = [
        {
            title: "Eğitim Videoları",
            description: "Hakemler için eğitim videoları ekleyin, kategorize edin ve düzenleyin.",
            href: "/admin/videos",
            icon: PlayCircle,
            color: "text-red-500",
            bgColor: "bg-red-500/10",
            borderColor: "hover:border-red-500/50"
        },
        ...(canSeeSoruHavuzu ? [{
            title: "Soru Havuzu",
            description: "Sınavlar için soru bankasını yönetin, zorluk seviyelerini ve kategorileri ayarlayın.",
            href: "/admin/questions",
            icon: Trophy,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            borderColor: "hover:border-orange-500/50"
        }] : []),
        {
            title: "Kural Kitabı",
            description: "Güncel kural kitapçıklarını ve PDF dökümanları yönetin.",
            href: "/admin/rules",
            icon: BookOpen,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "hover:border-blue-500/50"
        },
    ];

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-24">
            {/* Premium Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 pb-10">
                <div className="flex items-center gap-5 mb-3">
                    <div className="p-4 bg-red-600 rounded-[2rem] shadow-2xl shadow-red-600/30 rotate-3">
                        <Briefcase className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white uppercase italic leading-none">
                            Hakem Çantası
                        </h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2 italic flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                            Yönetim Merkezi
                        </p>
                    </div>
                </div>
                <p className="text-zinc-500 text-xl font-medium max-w-3xl leading-relaxed italic mt-4">
                    Hakemlerin gelişimi için gerekli olan tüm materyalleri, videoları ve sınav havuzunu bu panel üzerinden merkezi olarak yönetebilirsiniz.
                </p>
            </header>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {managementItems.map((item) => (
                    <Link key={item.href} href={item.href} className="group">
                        <div className={`
                            h-full bg-white dark:bg-zinc-900 
                            border-2 border-zinc-100 dark:border-zinc-800 
                            rounded-[3rem] p-10 transition-all duration-500 
                            hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] 
                            hover:translate-y-[-8px] hover:border-red-600/20
                            relative overflow-hidden
                        `}>
                            <div className={`w-16 h-16 rounded-[1.5rem] ${item.bgColor} flex items-center justify-center mb-8 transition-all group-hover:scale-110 group-hover:rotate-3 duration-500`}>
                                <item.icon className={`w-8 h-8 ${item.color}`} />
                            </div>

                            <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 group-hover:text-red-600 transition-colors uppercase italic tracking-tighter">
                                {item.title}
                            </h3>

                            <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mb-8 italic">
                                {item.description}
                            </p>

                            <div className="flex items-center text-[10px] font-black text-red-600 dark:text-red-500 uppercase tracking-[0.2em]">
                                YÖNETMEYE BAŞLA
                                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-2" />
                            </div>

                            {/* Background decoration */}
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-zinc-50 dark:bg-zinc-800/10 rounded-full blur-3xl group-hover:bg-red-600/5 transition-colors" />
                        </div>
                    </Link>
                ))}
            </div>

            {/* Bilgi Kartı - Premium Style */}
            <div className="bg-zinc-900 dark:bg-white rounded-[4rem] p-12 md:p-16 text-white dark:text-zinc-900 overflow-hidden relative group shadow-2xl">
                <div className="relative z-10 max-w-3xl">
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-red-500 mb-6 block italic">Stratejik Planlama</span>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-6 leading-tight">Yönetici Notları</h2>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xl font-medium leading-relaxed italic">
                        Hakemlerin sürekli güncel kalması için periyodik olarak yeni eğitim videoları ve sınav soruları eklemeniz önerilir.
                        Özellikle her ay başında kural güncellemelerini kontrol etmeyi unutmayın.
                    </p>
                </div>
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity duration-700">
                    <Briefcase className="w-80 h-80 -mr-24 -mt-24 rotate-12" />
                </div>

                {/* Decorative gradients */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent opacity-50" />
            </div>
        </div>
    );
}
