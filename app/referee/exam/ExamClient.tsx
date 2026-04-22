// ExamClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRandomQuestions, submitExam, getAssignmentQuestions } from "@/app/actions/exam";
import { QuizCard } from "@/components/referee/QuizCard";
import { Loader2, CheckCircle, XCircle, Brain, Trophy, Zap, Clock } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface Question {
    id: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
}

export default function ExamClient({
    refereeId,
    assignmentId,
    initialQuestionCount = 20,
    assignmentTitle
}: {
    refereeId: number;
    assignmentId?: number;
    initialQuestionCount?: number;
    assignmentTitle?: string;
}) {
    const router = useRouter();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [examStarted, setExamStarted] = useState(false);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Orta");

    const startExam = async (difficulty: string) => {
        setSelectedDifficulty(difficulty);
        setLoading(true);
        setError(null);

        let result;
        if (assignmentId) {
            result = await getAssignmentQuestions(assignmentId, refereeId);
        } else {
            result = await getRandomQuestions(difficulty, refereeId);
        }

        if (result.success && result.questions) {
            setQuestions(result.questions as Question[]);
            setExamStarted(true);
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

        const result = await submitExam(refereeId, examAnswers, selectedDifficulty, assignmentId);

        if (result.success) {
            alert(assignmentId ? "Ödev başarıyla tamamlandı!" : "Sınav başarıyla gönderildi!");
            router.push("/referee/results");
        } else {
            alert(result.error || "Sınav gönderilirken bir hata oluştu");
            setSubmitting(false);
        }
    };

    const qCount = questions.length || initialQuestionCount;
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / qCount) * 100;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-center bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                    <Loader2 className="w-16 h-16 animate-spin text-red-600 mx-auto mb-4" />
                    <p className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Sınav Hazırlanıyor</p>
                    <p className="text-zinc-500 dark:text-zinc-400 font-medium">Lütfen bekleyin, {selectedDifficulty} seviyesinde sorular getiriliyor...</p>
                </div>
            </div>
        );
    }

    if (!examStarted) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">Eğitim Sınavı</h1>
                    <p className="text-xl text-zinc-500 font-medium">Becerilerini test etmek için bir zorluk seviyesi seç ve başla!</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Easy */}
                    <button
                        onClick={() => startExam("Kolay")}
                        className="group bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-green-500 transition-all text-center shadow-xl hover:shadow-green-100 dark:hover:shadow-green-900/10 hover:-translate-y-2"
                    >
                        <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Zap className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Kolay</h3>
                        <p className="text-zinc-500 font-medium mb-6">Temel kurallar ve basit oyun durumları.</p>
                        <div className="py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-green-700 dark:text-green-400 font-bold">BAŞLA</div>
                    </button>

                    {/* Medium */}
                    <button
                        onClick={() => startExam("Orta")}
                        className="group bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-500 transition-all text-center shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/10 hover:-translate-y-2"
                    >
                        <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Brain className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Orta</h3>
                        <p className="text-zinc-500 font-medium mb-6">Detaylı kurallar ve karmaşık pozisyonlar.</p>
                        <div className="py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-blue-700 dark:text-blue-400 font-bold">BAŞLA</div>
                    </button>

                    {/* Hard */}
                    <button
                        onClick={() => startExam("Zor")}
                        className="group bg-white dark:bg-zinc-900 p-8 rounded-3xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-red-500 transition-all text-center shadow-xl hover:shadow-red-100 dark:hover:shadow-red-900/10 hover:-translate-y-2"
                    >
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                            <Trophy className="w-10 h-10 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Zor</h3>
                        <p className="text-zinc-500 font-medium mb-6">Dünya standartlarında kural yorumlama.</p>
                        <div className="py-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-red-700 dark:text-red-400 font-bold">BAŞLA</div>
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4">
                <div className="bg-white dark:bg-zinc-900 border-2 border-red-100 dark:border-red-900/30 rounded-3xl p-12 text-center shadow-2xl">
                    <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4">Üzgünüz!</h2>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium mb-8">{error}</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => startExam(selectedDifficulty)}
                            className="px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-bold shadow-lg shadow-red-200 dark:shadow-none"
                        >
                            Tekrar Dene
                        </button>
                        <button
                            onClick={() => setExamStarted(false)}
                            className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-bold"
                        >
                            Geri Dön
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${assignmentId ? "bg-indigo-100 text-indigo-700" :
                            selectedDifficulty === "Kolay" ? "bg-green-100 text-green-700" :
                                selectedDifficulty === "Zor" ? "bg-red-100 text-red-700" :
                                    "bg-blue-100 text-blue-700"
                            }`}>
                            {assignmentId ? "ZORUNLU ÖDEV" : `${selectedDifficulty} SEVİYE`}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight">
                        {assignmentTitle || "Eğitim Sınavı"}
                    </h1>
                </div>
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Kalan Soru</p>
                        <p className="text-2xl font-black text-red-600">{qCount - answeredCount}</p>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-10 sticky top-4 z-20">
                <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl p-4 rounded-2xl shadow-xl border border-white dark:border-zinc-800">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                            İlerleme Durumu
                        </span>
                        <span className="text-xs font-black text-red-600">
                            %{Math.round(progress)}
                        </span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-500 ease-out rounded-full ${progress === 100 ? "bg-green-500" : "bg-red-600"
                                }`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Questions */}
            <div className="space-y-8 mb-12">
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
            <div className=" sticky bottom-6 z-30">
                <button
                    onClick={handleSubmit}
                    disabled={submitting || answeredCount < qCount}
                    className={`w-full py-6 rounded-3xl font-black text-xl transition-all shadow-2xl flex items-center justify-center gap-3 ${submitting || answeredCount < qCount
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed border-2 border-zinc-100 dark:border-zinc-700"
                        : "bg-red-600 text-white hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] shadow-red-200 dark:shadow-none"
                        }`}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            GÖNDERİLİYOR...
                        </>
                    ) : answeredCount < qCount ? (
                        <>EKSİKLER VAR ({answeredCount}/{qCount})</>
                    ) : (
                        <>
                            <CheckCircle className="w-6 h-6" />
                            SINAVI BİTİR VE GÖNDER
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
