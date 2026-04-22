"use client";

import React, { useState, useEffect, useMemo } from "react";
import { getAllExamResults } from "@/app/actions/admin-exam";
import { Loader2, Trophy, ChevronDown, ChevronUp, User, Search, UserCheck, ShieldCheck } from "lucide-react";

interface UserAnswer {
    id: number;
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
}

interface ExamAttempt {
    id: number;
    score: number;
    totalQuestions: number;
    difficulty: string | null;
    createdAt: Date;
    referee: {
        firstName: string;
        lastName: string;
        email: string | null;
        classification: string;
    } | null;
    official: {
        firstName: string;
        lastName: string;
        email: string | null;
        officialType: string;
    } | null;
    answers: UserAnswer[];
}

const CLASSIFICATIONS = ["Tümü", "A Klasman", "B Klasman", "C Klasman", "Bölgesel Lig", "İl Hakemi", "Aday Hakem"];
const OFFICIAL_TYPES = [
    { id: "Tümü", label: "Tümü" },
    { id: "Masa Görevlisi", label: "Masa Görevlisi" },
    { id: "Gözlemci", label: "Gözlemci" },
    { id: "İstatistikçi", label: "İstatistikçi" },
    { id: "Sağlık Görevlisi", label: "Sağlık Görevlisi" }
];

export default function ExamResultsPage() {
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<"HAKEM" | "GOREVLI">("HAKEM");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedClass, setSelectedClass] = useState("Tümü");

    useEffect(() => {
        loadResults();
    }, []);

    const loadResults = async () => {
        setLoading(true);
        const result = await getAllExamResults();
        if (result.success && result.attempts) {
            setAttempts(result.attempts as ExamAttempt[]);
        }
        setLoading(false);
    };

    const getScoreColor = (score: number, total: number) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return "text-green-600 dark:text-green-400";
        if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    const getScoreBgColor = (score: number, total: number) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return "bg-green-50 dark:bg-green-900/20";
        if (percentage >= 60) return "bg-yellow-50 dark:bg-yellow-900/20";
        return "bg-red-50 dark:bg-red-900/20";
    };

    const filteredAttempts = useMemo(() => {
        return attempts.filter(attempt => {
            // 1. Target Tab Filter
            if (activeTab === "HAKEM" && !attempt.referee) return false;
            if (activeTab === "GOREVLI" && !attempt.official) return false;

            // 2. Search Filter
            const target = attempt.referee || attempt.official;
            if (target) {
                const query = searchQuery.toLowerCase();
                const fullName = `${target.firstName} ${target.lastName}`.toLowerCase();
                const emailMatch = target.email?.toLowerCase().includes(query);
                if (!fullName.includes(query) && !emailMatch) return false;
            }

            // 3. Classification Filter
            if (selectedClass !== "Tümü") {
                if (activeTab === "HAKEM" && attempt.referee) {
                    if (attempt.referee.classification !== selectedClass) return false;
                }
                if (activeTab === "GOREVLI" && attempt.official) {
                    if (attempt.official.officialType !== selectedClass) return false;
                }
            }

            return true;
        });
    }, [attempts, activeTab, searchQuery, selectedClass]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight uppercase italic">
                        Sınav Sonuçları Merkezi
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">
                        Sistem üzerinden çözülen tüm sınav ve pratiğin detaylı dökümü.
                    </p>
                </div>

                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl shadow-inner max-w-sm w-full">
                    <button
                        onClick={() => { setActiveTab("HAKEM"); setSelectedClass("Tümü"); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                            activeTab === "HAKEM"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        HAKEMLER
                    </button>
                    <button
                        onClick={() => { setActiveTab("GOREVLI"); setSelectedClass("Tümü"); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-black transition-all ${
                            activeTab === "GOREVLI"
                                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        }`}
                    >
                        <UserCheck className="w-4 h-4" />
                        GÖREVLİLER
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 w-5 h-5 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="İsim veya E-posta ile ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:border-red-600 focus:ring-1 focus:ring-red-600 outline-none transition-all text-sm font-medium"
                    />
                </div>

                {/* Classification Filters */}
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0 items-center px-1">
                    {(activeTab === "HAKEM" ? CLASSIFICATIONS : OFFICIAL_TYPES.map(o => o.id)).map((cls) => (
                        <button
                            key={cls}
                            onClick={() => setSelectedClass(cls)}
                            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                selectedClass === cls
                                    ? "bg-red-600 text-white shadow-md shadow-red-200 dark:shadow-none"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            }`}
                        >
                            {activeTab === "HAKEM" ? cls : OFFICIAL_TYPES.find(o => o.id === cls)?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Table/Cards */}
            {filteredAttempts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm p-12 text-center border border-zinc-200 dark:border-zinc-800">
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-wide">
                        Sonuç Bulunamadı
                    </h3>
                    <p className="text-zinc-500 dark:text-zinc-400">
                        Seçmiş olduğunuz filtrelere uygun bir sınav kaydı mevcut değil.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Aday / Görevli</th>
                                    <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Sınıf/Rol</th>
                                    <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Skor</th>
                                    <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Zorluk</th>
                                    <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Başarı</th>
                                    <th className="px-6 py-4 text-xs font-black text-zinc-400 uppercase tracking-widest">Tarih</th>
                                    <th className="px-6 py-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                {filteredAttempts.map((attempt) => {
                                    const target = attempt.referee || attempt.official;
                                    if (!target) return null;
                                    const percentage = (attempt.score / attempt.totalQuestions) * 100;
                                    const isExpanded = expandedAttempt === attempt.id;
                                    const roleName = attempt.referee ? attempt.referee.classification : (attempt.official ? attempt.official.officialType : "-");

                                    return (
                                        <React.Fragment key={attempt.id}>
                                            <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors group">
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                            <User className="w-5 h-5 text-zinc-400" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                                                {target.firstName} {target.lastName}
                                                            </div>
                                                            <div className="text-xs text-zinc-500 font-medium">
                                                                {target.email || "E-posta yok"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className="px-3 py-1.5 text-xs font-black tracking-tighter uppercase rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                                                        {roleName}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <span className={`text-xl font-black ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                                                        {attempt.score}<span className="text-zinc-300 dark:text-zinc-600 text-base">/{attempt.totalQuestions}</span>
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    {!attempt.difficulty ? (
                                                         <span className="px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-tighter bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                                            ZORUNLU ODEV
                                                        </span>
                                                    ) : (
                                                    <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-tighter ${
                                                        attempt.difficulty === "Kolay" ? "bg-green-100 text-green-700" :
                                                        attempt.difficulty === "Zor" ? "bg-red-100 text-red-700" :
                                                        "bg-blue-100 text-blue-700"
                                                    }`}>
                                                        {attempt.difficulty || "Orta"} SEVIYE
                                                    </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap">
                                                    <div className={`px-4 py-1.5 rounded-lg text-sm font-black tracking-tight inline-flex items-center justify-center ${getScoreBgColor(attempt.score, attempt.totalQuestions)}`}>
                                                        <span className={getScoreColor(attempt.score, attempt.totalQuestions)}>
                                                            %{percentage.toFixed(0)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-zinc-500">
                                                    {new Date(attempt.createdAt).toLocaleDateString("tr-TR", {
                                                        day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                                    })}
                                                </td>
                                                <td className="px-6 py-5 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                                                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="px-8 py-6 bg-zinc-50/80 dark:bg-zinc-950/50 border-y border-zinc-100 dark:border-zinc-800">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
                                                                <h4 className="font-black text-sm uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                                                                    Sınav Cevap Dökümü
                                                                </h4>
                                                            </div>
                                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                                {attempt.answers.map((answer, idx) => (
                                                                    <div
                                                                        key={answer.id}
                                                                        className={`p-4 rounded-2xl text-sm border-2 ${
                                                                            answer.isCorrect
                                                                                ? "bg-white dark:bg-zinc-900 border-green-100 dark:border-green-900/30"
                                                                                : "bg-white dark:bg-zinc-900 border-red-100 dark:border-red-900/30"
                                                                        }`}
                                                                    >
                                                                        <div className="flex gap-3 mb-2">
                                                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black ${answer.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                                {idx + 1}
                                                                            </div>
                                                                            <div className="font-medium text-zinc-800 dark:text-zinc-200">
                                                                                {answer.questionText}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-wrap gap-4 pl-9 text-xs">
                                                                            <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">
                                                                                <span className="text-zinc-400 font-bold uppercase">Cevap:</span> 
                                                                                <strong className={answer.isCorrect ? "text-green-600" : "text-red-600"}>{answer.selectedAnswer}</strong>
                                                                            </span>
                                                                            {!answer.isCorrect && (
                                                                                <span className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/50 px-3 py-1 rounded-lg">
                                                                                    <span className="text-zinc-500 font-bold uppercase">Doğru:</span> 
                                                                                    <strong className="text-green-600 dark:text-green-400">{answer.correctAnswer}</strong>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {filteredAttempts.map((attempt) => {
                            const target = attempt.referee || attempt.official;
                            if (!target) return null;
                            const percentage = (attempt.score / attempt.totalQuestions) * 100;
                            const isExpanded = expandedAttempt === attempt.id;
                            const roleName = attempt.referee ? attempt.referee.classification : (attempt.official ? attempt.official.officialType : "-");

                            return (
                                <div
                                    key={attempt.id}
                                    className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                >
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-zinc-400" />
                                                </div>
                                                <div>
                                                    <div className="font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tight">
                                                        {target.firstName} {target.lastName}
                                                    </div>
                                                    <div className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 mt-0.5">
                                                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-600 dark:text-zinc-300">{roleName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-2xl font-black ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                                                    {attempt.score}<span className="text-zinc-300 text-lg">/{attempt.totalQuestions}</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className={`px-4 py-1.5 rounded-lg text-sm font-black inline-flex items-center justify-center ${getScoreBgColor(attempt.score, attempt.totalQuestions)}`}>
                                                <span className={getScoreColor(attempt.score, attempt.totalQuestions)}>
                                                    Başarı: %{percentage.toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="text-xs font-medium text-zinc-400 text-right">
                                                <div className="text-zinc-600 dark:text-zinc-300 font-bold mb-0.5">{attempt.difficulty ? `${attempt.difficulty} SEVİYE` : 'ZORUNLU ODEV'}</div>
                                                {new Date(attempt.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" })}
                                            </div>
                                        </div>
                                        
                                        <button
                                            onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                                            className="w-full py-3 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isExpanded ? <><ChevronUp className="w-4 h-4"/> Detayları Gizle</> : <><ChevronDown className="w-4 h-4"/> Detayları Göster</>}
                                        </button>
                                    </div>
                                    
                                    {isExpanded && (
                                        <div className="px-5 pb-5 space-y-3 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 pt-5">
                                            {attempt.answers.map((answer, idx) => (
                                                <div
                                                    key={answer.id}
                                                    className={`p-4 rounded-xl text-sm border ${
                                                        answer.isCorrect
                                                            ? "bg-white dark:bg-zinc-900 border-green-200 dark:border-green-900/30"
                                                            : "bg-white dark:bg-zinc-900 border-red-200 dark:border-red-900/30"
                                                    }`}
                                                >
                                                    <div className="font-medium text-zinc-800 dark:text-zinc-200 mb-2 leading-relaxed">
                                                        <span className={answer.isCorrect ? "text-green-600 font-black mr-2" : "text-red-600 font-black mr-2"}>{idx + 1}.</span> 
                                                        {answer.questionText}
                                                    </div>
                                                    <div className="flex flex-col gap-2 text-xs">
                                                        <span className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg">
                                                            <span className="text-zinc-500 font-bold">Adayın Cevabı:</span> 
                                                            <strong className={answer.isCorrect ? "text-green-600" : "text-red-600"}>{answer.selectedAnswer}</strong>
                                                        </span>
                                                        {!answer.isCorrect && (
                                                            <span className="flex items-center gap-2 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/50 p-2 rounded-lg">
                                                                <span className="text-green-700 dark:text-green-500 font-bold">Doğru Cevap:</span> 
                                                                <strong className="text-green-600 dark:text-green-400">{answer.correctAnswer}</strong>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
