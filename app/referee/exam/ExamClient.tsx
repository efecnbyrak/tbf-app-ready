"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRandomQuestions, submitExam } from "@/app/actions/exam";
import { QuizCard } from "@/components/referee/QuizCard";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface Question {
    id: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
}

export default function ExamClient({ refereeId }: { refereeId: number }) {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        setLoading(true);
        setError(null);

        const result = await getRandomQuestions();

        if (result.success && result.questions) {
            setQuestions(result.questions as Question[]);
        } else {
            setError(result.error || "Sorular yüklenemedi");
        }

        setLoading(false);
    };

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setAnswers((prev) => ({
            ...prev,
            [questionId]: answer,
        }));
    };

    const handleSubmit = async () => {
        // Check if all questions are answered
        const unanswered = questions.filter((q) => !answers[q.id]);

        if (unanswered.length > 0) {
            alert(`Lütfen tüm soruları cevaplayın. ${unanswered.length} soru cevaplanmadı.`);
            return;
        }

        if (!confirm("Sınavı göndermek istediğinizden emin misiniz?")) {
            return;
        }

        setSubmitting(true);

        const examAnswers = questions.map((q) => ({
            questionId: q.id,
            questionText: q.questionText,
            selectedAnswer: answers[q.id],
            correctAnswer: q.correctAnswer,
        }));

        const result = await submitExam(refereeId, examAnswers);

        if (result.success) {
            alert("Sınav başarıyla gönderildi!");
            router.push("/referee/results");
        } else {
            alert(result.error || "Sınav gönderilirken bir hata oluştu");
            setSubmitting(false);
        }
    };

    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / 20) * 100;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-zinc-600 dark:text-zinc-400">Sorular yükleniyor...</p>
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
                    <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
                    <button
                        onClick={loadQuestions}
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Tekrar Dene
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Hakem Sınavı
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Tüm soruları cevaplayın ve sınavı gönderin
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6 bg-white dark:bg-zinc-900 rounded-lg shadow p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        İlerleme
                    </span>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {answeredCount} / 20
                    </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-red-600 to-red-500 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-6 mb-6">
                {questions.map((question, index) => (
                    <QuizCard
                        key={question.id}
                        questionNumber={index + 1}
                        questionText={question.questionText}
                        optionA={question.optionA}
                        optionB={question.optionB}
                        optionC={question.optionC}
                        optionD={question.optionD}
                        selectedAnswer={answers[question.id]}
                        onAnswerSelect={(answer) => handleAnswerSelect(question.id, answer)}
                    />
                ))}
            </div>

            {/* Submit Button */}
            <div className="sticky bottom-4 bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-4 border-2 border-zinc-200 dark:border-zinc-800">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || answeredCount < 20}
                    className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${submitting || answeredCount < 20
                            ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl"
                        }`}
                >
                    {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Gönderiliyor...
                        </span>
                    ) : answeredCount < 20 ? (
                        `Tüm Soruları Cevaplayın (${answeredCount}/20)`
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Sınavı Gönder
                        </span>
                    )}
                </button>
            </div>
        </div>
    );
}
