"use client";

import Link from "next/link";
import { PlayCircle, Trophy, BookOpen, Briefcase, Sparkles } from "lucide-react";

export default function RefereeBagPage() {
    const sections = [
        {
            title: "Eğitim Videoları",
            description: "Eğitim amaçlı oyun içi enstantane videolarını izleyin ve kendinizi geliştirin.",
            icon: <PlayCircle className="w-12 h-12 text-red-600 mb-4" />,
            href: "/referee/videos",
            color: "border-red-200 dark:border-red-900/50 hover:border-red-500",
            bg: "bg-red-50 dark:bg-red-900/10"
        },

        {
            title: "Kural Kitabı",
            description: "Oyun kuralları, federasyon talimatları ve FIBA yorumlarına göz atın.",
            icon: <BookOpen className="w-12 h-12 text-blue-600 mb-4" />,
            href: "/referee/rules",
            color: "border-blue-200 dark:border-blue-900/50 hover:border-blue-500",
            bg: "bg-blue-50 dark:bg-blue-900/10"
        },

    ];

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <header className="border-b border-zinc-200 dark:border-zinc-800 pb-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20">
                        <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white uppercase italic">
                        Hakem Çantası
                    </h1>
                </div>
                <p className="text-zinc-500 text-xl font-medium max-w-2xl">
                    Kariyerinizi destekleyecek eğitim materyalleri ve kural kitaplarına buradan ulaşabilirsiniz.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {sections.map((section, idx) => (
                    <Link key={idx} href={section.href} className="flex">
                        <div className={`
                            group flex flex-col items-center justify-center p-10 
                            rounded-3xl border-2 transition-all duration-300 cursor-pointer 
                            hover:shadow-2xl hover:-translate-y-2 h-full text-center w-full
                            ${section.color} ${section.bg} backdrop-blur-sm
                        `}>
                            <div className="transform group-hover:scale-110 transition-transform duration-300">
                                {section.icon}
                            </div>
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                                {section.title}
                            </h2>
                            <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg leading-relaxed">
                                {section.description}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
