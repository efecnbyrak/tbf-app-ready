"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUserExamHistory } from "@/app/actions/exam";
import { Loader2, Trophy, Calendar, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

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
    answers: UserAnswer[];
}

export default function ResultsClient({ refereeId }: { refereeId: number }) {
    const router = useRouter();
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);

        const result = await getUserExamHistory(refereeId);

        if (result.success && result.attempts) {
            setAttempts(result.attempts as any[]);
        } else {
            setError(result.error || "Sonuçlar yüklenemedi");
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
        if (percentage >= 80) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
        if (percentage >= 60) return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">Sonuçlar yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">Hata</h2>
                    <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        Sınav Sonuçlarım
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Geçmiş sınav denemeleriniz ve sonuçlarınız
                    </p>
                </div>
                <button
                    onClick={() => router.push("/referee/exam")}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    Yeni Sınav Başlat
                </button>
            </div>

            {/* Results List */}
            {attempts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center border border-zinc-200 dark:border-zinc-800">
                    <Trophy className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Henüz sınav sonucunuz yok
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                        İlk sınavınızı başlatarak başlayın
                    </p>
                    <button
                        onClick={() => router.push("/referee/exam")}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Sınav Başlat
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {attempts.map((attempt) => {
                        const percentage = (attempt.score / attempt.totalQuestions) * 100;
                        const isExpanded = expandedAttempt === attempt.id;

                        return (
                            <div
                                key={attempt.id}
                                className={`rounded-lg shadow border ${getScoreBgColor(attempt.score, attempt.totalQuestions)} overflow-hidden`}
                            >
                                {/* Summary */}
                                <div
                                    className="p-6 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                                                    <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        {new Date(attempt.createdAt).toLocaleDateString("tr-TR", {
                                                            year: "numeric",
                                                            month: "long",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </span>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${attempt.difficulty === "Kolay" ? "bg-green-100 text-green-700" :
                                                        attempt.difficulty === "Zor" ? "bg-red-100 text-red-700" :
                                                            "bg-blue-100 text-blue-700"
                                                    }`}>
                                                    {attempt.difficulty || "Orta"}
                                                </span>
                                            </div>
                                            <div className="flex items-baseline gap-3">
                                                <span className={`text-3xl font-bold ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                                                    {attempt.score}/{attempt.totalQuestions}
                                                </span>
                                                <span className={`text-lg font-semibold ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                                                    ({percentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-zinc-600 dark:text-zinc-400">
                                                {isExpanded ? "Detayları Gizle" : "Detayları Göster"}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Answers */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-6">
                                        <h4 className="font-semibold text-lg mb-4 text-zinc-900 dark:text-zinc-100">
                                            Cevap Detayları
                                        </h4>
                                        <div className="space-y-3">
                                            {attempt.answers.map((answer, index) => (
                                                <div
                                                    key={answer.id}
                                                    className={`p-4 rounded-lg border-2 ${answer.isCorrect
                                                        ? "bg-green-50 dark:bg-green-900/10 border-green-300 dark:border-green-800"
                                                        : "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800"
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {answer.isCorrect ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                                                                Soru {index + 1}
                                                            </div>
                                                            <div className="text-zinc-900 dark:text-zinc-100 mb-2 break-words">
                                                                {answer.questionText}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                                                <div>
                                                                    <span className="text-zinc-600 dark:text-zinc-400">Cevabınız: </span>
                                                                    <span
                                                                        className={`font-bold ${answer.isCorrect
                                                                            ? "text-green-700 dark:text-green-400"
                                                                            : "text-red-700 dark:text-red-400"
                                                                            }`}
                                                                    >
                                                                        {answer.selectedAnswer}
                                                                    </span>
                                                                </div>
                                                                {!answer.isCorrect && (
                                                                    <div>
                                                                        <span className="text-zinc-600 dark:text-zinc-400">Doğru Cevap: </span>
                                                                        <span className="font-bold text-green-700 dark:text-green-400">
                                                                            {answer.correctAnswer}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
