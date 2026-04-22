"use client";

import { useState } from "react";
import { BookOpen, Target, Settings, Settings2, Pencil, CalendarClock } from "lucide-react";
import QuestionsClient from "./QuestionsClient";
import { AssignmentsClient } from "./AssignmentsClient";

interface QuestionsHubClientProps {
    initialAssignments: any[];
    categories: string[];
}

export default function QuestionsHubClient({ initialAssignments, categories }: QuestionsHubClientProps) {
    const [activeTab, setActiveTab] = useState<"SORULAR" | "ODEVLER">("SORULAR");

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-200 dark:shadow-none">
                        <BookOpen className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight uppercase italic">
                            Eğitim & Soru Havuzu
                        </h1>
                        <p className="text-zinc-500 font-medium mt-1 uppercase text-xs tracking-widest">
                            {activeTab === "SORULAR" ? "Soru Yönetim Sistemi" : "Sınav ve Ödev Yönetim Merkezi"}
                        </p>
                    </div>
                </div>

                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl shadow-inner overflow-hidden">
                    <button
                        onClick={() => setActiveTab("SORULAR")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === "SORULAR"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                    >
                        <Pencil className="w-4 h-4" />
                        SORU HAVUZU
                    </button>
                    <button
                        onClick={() => setActiveTab("ODEVLER")}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all ${activeTab === "ODEVLER"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                            }`}
                    >
                        <CalendarClock className="w-4 h-4" />
                        ÖDEV VE SINAVLAR
                    </button>
                </div>
            </header>

            {/* Separator / Animated Line */}
            <div className="h-0.5 bg-zinc-100 dark:bg-zinc-800 relative rounded-full overflow-hidden">
                <div
                    className="absolute top-0 bottom-0 w-1/2 bg-red-600 rounded-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(${activeTab === "SORULAR" ? "0%" : "100%"})` }}
                />
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === "SORULAR" ? (
                    <QuestionsClient />
                ) : (
                    <AssignmentsClient initialAssignments={initialAssignments} categories={categories} />
                )}
            </div>
        </div>
    );
}
