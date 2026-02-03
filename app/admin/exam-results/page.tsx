"use client";

import { useState, useEffect } from "react";
import { getAllExamResults } from "@/app/actions/admin-exam";
import { Loader2, Trophy, ChevronDown, ChevronUp, User } from "lucide-react";

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
    createdAt: string;
    referee: {
        firstName: string;
        lastName: string;
        tckn: string;
        classification: string;
    };
    answers: UserAnswer[];
}

export default function ExamResultsPage() {
    const [attempts, setAttempts] = useState<ExamAttempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Sınav Sonuçları
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Tüm hakemlerin sınav denemeleri ve sonuçları
                </p>
            </div>

            {/* Results Table/Cards */}
            {attempts.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center border border-zinc-200 dark:border-zinc-800">
                    <Trophy className="w-16 h-16 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">Henüz sınav denemesi yok</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white dark:bg-zinc-900 rounded-lg shadow border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-zinc-100 dark:bg-zinc-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                        Hakem
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                        Sınıf
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                        Skor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                        Başarı Oranı
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                        Tarih
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                                        Detay
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                {attempts.map((attempt) => {
                                    const percentage = (attempt.score / attempt.totalQuestions) * 100;
                                    const isExpanded = expandedAttempt === attempt.id;

                                    return (
                                        <>
                                            <tr key={attempt.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                                        {attempt.referee.firstName} {attempt.referee.lastName}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        TCKN: {attempt.referee.tckn}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                                                        {attempt.referee.classification}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`text-lg font-bold ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                                                        {attempt.score}/{attempt.totalQuestions}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(attempt.score, attempt.totalQuestions)}`}>
                                                        <span className={getScoreColor(attempt.score, attempt.totalQuestions)}>
                                                            %{percentage.toFixed(0)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                                                    {new Date(attempt.createdAt).toLocaleDateString("tr-TR", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <button
                                                        onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                                    >
                                                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50">
                                                        <div className="space-y-2">
                                                            <h4 className="font-semibold text-sm mb-3 text-zinc-900 dark:text-zinc-100">
                                                                Cevap Detayları:
                                                            </h4>
                                                            {attempt.answers.map((answer, idx) => (
                                                                <div
                                                                    key={answer.id}
                                                                    className={`p-3 rounded text-sm ${answer.isCorrect
                                                                            ? "bg-green-50 dark:bg-green-900/10 border-l-4 border-green-500"
                                                                            : "bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500"
                                                                        }`}
                                                                >
                                                                    <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                                                                        S{idx + 1}: {answer.questionText}
                                                                    </div>
                                                                    <div className="flex gap-4 text-xs">
                                                                        <span>
                                                                            Cevap: <strong>{answer.selectedAnswer}</strong>
                                                                        </span>
                                                                        {!answer.isCorrect && (
                                                                            <span>
                                                                                Doğru: <strong className="text-green-600 dark:text-green-400">{answer.correctAnswer}</strong>
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {attempts.map((attempt) => {
                            const percentage = (attempt.score / attempt.totalQuestions) * 100;
                            const isExpanded = expandedAttempt === attempt.id;

                            return (
                                <div
                                    key={attempt.id}
                                    className="bg-white dark:bg-zinc-900 rounded-lg shadow border border-zinc-200 dark:border-zinc-800 overflow-hidden"
                                >
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                                                <div>
                                                    <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                        {attempt.referee.firstName} {attempt.referee.lastName}
                                                    </div>
                                                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                        {attempt.referee.classification}
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={`text-2xl font-bold ${getScoreColor(attempt.score, attempt.totalQuestions)}`}>
                                                {attempt.score}/{attempt.totalQuestions}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreBgColor(attempt.score, attempt.totalQuestions)}`}>
                                                <span className={getScoreColor(attempt.score, attempt.totalQuestions)}>
                                                    %{percentage.toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                                {new Date(attempt.createdAt).toLocaleDateString("tr-TR", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "numeric",
                                                })}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                                            className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            {isExpanded ? "Detayları Gizle" : "Detayları Göster"}
                                        </button>
                                    </div>
                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-2">
                                            {attempt.answers.map((answer, idx) => (
                                                <div
                                                    key={answer.id}
                                                    className={`p-3 rounded text-sm ${answer.isCorrect
                                                            ? "bg-green-50 dark:bg-green-900/10"
                                                            : "bg-red-50 dark:bg-red-900/10"
                                                        }`}
                                                >
                                                    <div className="font-medium text-zinc-900 dark:text-zinc-100 mb-1 text-xs">
                                                        S{idx + 1}: {answer.questionText}
                                                    </div>
                                                    <div className="flex gap-3 text-xs">
                                                        <span>
                                                            Cevap: <strong>{answer.selectedAnswer}</strong>
                                                        </span>
                                                        {!answer.isCorrect && (
                                                            <span>
                                                                Doğru: <strong className="text-green-600 dark:text-green-400">{answer.correctAnswer}</strong>
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
