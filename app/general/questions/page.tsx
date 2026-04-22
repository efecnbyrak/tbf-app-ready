"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllQuestions } from "@/app/actions/admin-exam";
import { Loader2, CheckCircle, XCircle, BookOpen, ChevronLeft, Trophy, Clock, Brain, Zap, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const CATEGORIES = [
    "Oyun",
    "Saha ve Donanım",
    "Takımlar",
    "Oyun Düzenlemeleri",
    "İhlaler",
    "Fauller",
    "Genel Koşullar",
    "Hakemler, Masa Görevlileri, Komiser: Görevleri ve Yetkileri"
];

const DIFFICULTIES = ["Kolay", "Orta", "Zor"];

interface Question {
    id: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    category?: string;
    difficulty: string;
}

export default function GeneralQuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState<0 | 1 | 2 | 3>(0); // 0 is selection mode
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        try {
            const [qRes, aRes] = await Promise.all([
                getAllQuestions(),
                fetch("/api/user/assignments").then(r => r.json())
            ]);

            if (qRes.success && qRes.questions) {
                setQuestions(qRes.questions as Question[]);
            }
            if (Array.isArray(aRes)) {
                setAssignments(aRes);
            }
        } catch (error) {
            console.error(error);
        }
        setLoading(false);
    };

    const filteredQuestions = questions.filter(q => q.category === selectedCategory && q.difficulty === selectedDifficulty);
    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
    const paginatedQuestions = filteredQuestions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case "Kolay": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "Zor": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            default: return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-center justify-between">
                {step === 0 ? (
                    <Link href="/general" className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Panele Dön
                    </Link>
                ) : (
                    <button onClick={() => {
                        if (step === 1) setStep(0);
                        else if (step === 2) setStep(1);
                        else if (step === 3) setStep(2);
                        setCurrentPage(1);
                    }} className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Geri Dön
                    </button>
                )}
            </div>

            {step === 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 italic uppercase italic tracking-tight">Kategori Seçimi</h1>
                        <p className="text-zinc-500 font-medium tracking-widest uppercase text-xs">Hangi alanda devam etmek istersiniz?</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Homeworks Section */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-3 text-lg font-black text-zinc-900 dark:text-white uppercase italic">
                                <Trophy className="text-red-600 w-5 h-5" /> Aktif Ödevlerim
                                {assignments.filter(a => !a.isCompleted).length > 0 && (
                                    <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">
                                        {assignments.filter(a => !a.isCompleted).length} YENİ
                                    </span>
                                )}
                            </h2>
                            <div className="space-y-4">
                                {assignments.length === 0 ? (
                                    <div className="p-10 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                                        <p className="text-zinc-400 font-bold uppercase text-[10px] tracking-widest">Henüz atanmış bir ödev yok</p>
                                    </div>
                                ) : (
                                    assignments.map(a => (
                                        <div key={a.id} className={`group bg-white dark:bg-zinc-900 border-2 rounded-[2rem] p-6 transition-all ${a.isCompleted ? 'border-zinc-100 opacity-60' : 'border-zinc-100 hover:border-red-600/50 shadow-xl'}`}>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${a.isCompleted ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                        {a.isCompleted ? 'TAMAMLANDI' : 'BEKLİYOR'}
                                                    </span>
                                                    {a.dueDate && (
                                                        <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> Son: {format(new Date(a.dueDate), "d MMM", { locale: tr })}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-4 line-clamp-1 italic uppercase">{a.title}</h3>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="text-xs font-black text-zinc-400 uppercase tracking-tighter">
                                                        {a.questionCount} SORU
                                                    </div>
                                                    {a.isCompleted && (
                                                        <div className="text-xs font-black text-green-600 uppercase tracking-tighter">
                                                            SKOR: {a.score}/{a.questionCount}
                                                        </div>
                                                    )}
                                                </div>
                                                {!a.isCompleted && (
                                                    <Link
                                                        href={`/general/exam?aid=${a.id}`}
                                                        className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95"
                                                    >
                                                        ÇÖZMEYE BAŞLA
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Practice Mode */}
                        <div className="space-y-6">
                            <h2 className="flex items-center gap-3 text-lg font-black text-zinc-900 dark:text-white uppercase italic">
                                <Brain className="text-blue-600 w-5 h-5" /> Serbest Pratik
                            </h2>
                            <button
                                onClick={() => setStep(1)}
                                className="w-full group bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] p-10 text-center hover:border-blue-600/50 hover:shadow-2xl transition-all relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-blue-600/10 transition-colors" />
                                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                    <Zap className="w-10 h-10 text-blue-600" />
                                </div>
                                <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 italic uppercase">Soru Havuzuna Gir</h3>
                                <p className="text-sm text-zinc-500 font-medium italic mb-8">Kategori ve zorluk seçerek kendini sına.</p>
                                <div className="inline-flex items-center gap-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-3 rounded-2xl text-[10px] font-black tracking-widest uppercase">
                                    Hemen Başla <ArrowRight className="w-4 h-4" />
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-in fade-in zoom-in-95 duration-300 max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Zorluk Derecesi</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-100 dark:bg-zinc-800 inline-block px-4 py-1 rounded-full">{selectedCategory}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {DIFFICULTIES.map(diff => (
                            <button
                                key={diff}
                                onClick={() => { setSelectedDifficulty(diff); setStep(3); }}
                                className="p-8 bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-3xl hover:border-red-500 hover:shadow-xl transition-all text-center group"
                            >
                                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${getDifficultyColor(diff)}`}>
                                    <span className="font-black text-xl">{diff[0]}</span>
                                </div>
                                <h3 className="font-black text-2xl text-zinc-800 dark:text-zinc-100">{diff}</h3>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-zinc-100 dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                        <div>
                            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">{selectedCategory}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(selectedDifficulty)}`}>{selectedDifficulty} Seviye</span>
                                <span className="text-sm font-medium text-zinc-500">{filteredQuestions.length} Soru Bulundu</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {paginatedQuestions.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-12 text-center border border-zinc-200 dark:border-zinc-800">
                                <XCircle className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Bu kategoride soru bulunmuyor</h3>
                            </div>
                        ) : (
                            paginatedQuestions.map((question, index) => (
                                <div key={question.id} className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600" />
                                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-6 pl-2">
                                        <span className="text-zinc-400 mr-2">{((currentPage - 1) * ITEMS_PER_PAGE) + index + 1}.</span>
                                        {question.questionText}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2">
                                        {(['A', 'B', 'C', 'D'] as const).map((key) => {
                                            const val = question[`option${key}` as keyof Question] as string;
                                            const isCorrect = question.correctAnswer === key;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${isCorrect
                                                        ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                                                        : 'bg-zinc-50/50 border-zinc-100 dark:bg-zinc-800/30 dark:border-zinc-800'
                                                        }`}
                                                >
                                                    <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black ${isCorrect ? 'bg-green-600 text-white' : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                                        {key}
                                                    </span>
                                                    <span className={`text-sm font-medium ${isCorrect ? 'text-green-700 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                                        {val}
                                                    </span>
                                                    {isCorrect && <CheckCircle className="ml-auto w-5 h-5 text-green-500" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-10">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="font-bold text-zinc-600 dark:text-zinc-400">Sayfa {currentPage} / {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transform rotate-180">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
