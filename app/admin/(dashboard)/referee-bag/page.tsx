import Link from "next/link";
import { FileText, PlayCircle, BookOpen } from "lucide-react";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function RefereeBagPage() {
    const session = await getSession();

    if (!session || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        redirect("/admin/login");
    }

    const sections = [
        {
            title: "Soru Havuzu",
            description: "Aday hakemler ve mevcut hakemler için oluşturulan sınav sorularını düzenleyin.",
            icon: <FileText className="w-10 h-10 text-blue-600 mb-4" />,
            href: "/admin/questions",
            color: "border-blue-200 dark:border-blue-900/50 hover:border-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/10"
        },
        {
            title: "Eğitim Videoları",
            description: "Eğitim amaçlı oyun içi enstantane videolarını yükleyin ve güncelleyin.",
            icon: <PlayCircle className="w-10 h-10 text-red-600 mb-4" />,
            href: "/admin/videos",
            color: "border-red-200 dark:border-red-900/50 hover:border-red-500",
            bg: "bg-red-50 dark:bg-red-900/10"
        },
        {
            title: "Kural Kitabı",
            description: "Oyun kuralları, federasyon talimatları ve FIBA yorumlarını organize edin.",
            icon: <BookOpen className="w-10 h-10 text-orange-600 mb-4" />,
            href: "/admin/rules",
            color: "border-orange-200 dark:border-orange-900/50 hover:border-orange-500",
            bg: "bg-orange-50 dark:bg-orange-900/10"
        }
    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            <header className="border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white uppercase">Hakem Çantası</h1>
                <p className="text-zinc-500 mt-2 text-lg">Eğitim, dokümantasyon ve kural modüllerini buradan yönetebilirsiniz.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sections.map((section, idx) => (
                    <Link key={idx} href={section.href}>
                        <div className={`
                            group flex flex-col items-center justify-center p-8 
                            rounded-3xl border-2 transition-all duration-300 cursor-pointer 
                            hover:shadow-2xl hover:-translate-y-2 h-full text-center
                            ${section.color} ${section.bg}
                        `}>
                            <div className="transform group-hover:scale-110 transition-transform duration-300">
                                {section.icon}
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{section.title}</h2>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium line-clamp-3">
                                {section.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
