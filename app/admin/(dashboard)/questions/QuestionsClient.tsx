"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
    getAllQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "@/app/actions/admin-exam";
import { Plus, Edit, Trash2, Loader2, CheckCircle, XCircle, BookOpen, Trophy } from "lucide-react";

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
    questionType?: string;
    category?: string;
    difficulty: string;
}

const emptyForm = {
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    questionType: "MULTIPLE_CHOICE",
    category: CATEGORIES[0],
    difficulty: "Orta",
};

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Tümü");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        loadQuestions();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCategory, selectedDifficulty, searchTerm]);

    const loadQuestions = async () => {
        setLoading(true);
        const result = await getAllQuestions();
        if (result.success && result.questions) {
            setQuestions(result.questions as Question[]);
        }
        setLoading(false);
    };

    const handleOpenModal = (question?: Question) => {
        if (question) {
            setEditingQuestion(question);
            setFormData({
                questionText: question.questionText,
                optionA: question.optionA,
                optionB: question.optionB,
                optionC: question.optionC,
                optionD: question.optionD,
                correctAnswer: question.correctAnswer,
                questionType: question.questionType || "MULTIPLE_CHOICE",
                category: question.category || CATEGORIES[0],
                difficulty: question.difficulty || "Orta",
            });
        } else {
            setEditingQuestion(null);
            setFormData({ ...emptyForm, optionA: "Seçenek A", optionB: "Seçenek B", optionC: "Seçenek C", optionD: "Seçenek D" });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        if (editingQuestion) {
            const result = await updateQuestion(editingQuestion.id, formData);
            if (result.success) {
                await loadQuestions();
                setShowModal(false);
            } else {
                alert(result.error);
            }
        } else {
            const result = await createQuestion(formData);
            if (result.success) {
                await loadQuestions();
                setShowModal(false);
            } else {
                alert(result.error);
            }
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;
        const result = await deleteQuestion(id);
        if (result.success) {
            await loadQuestions();
        } else {
            alert(result.error);
        }
    };

    const filteredQuestions = questions.filter(q => {
        const catMatch = selectedCategory === "Tümü" || q.category === selectedCategory;
        const diffMatch = selectedDifficulty === "Tümü" || q.difficulty === selectedDifficulty;
        const searchMatch = !searchTerm ||
            q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.optionA.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.optionB.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.optionC.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.optionD.toLowerCase().includes(searchTerm.toLowerCase());
        return catMatch && diffMatch && searchMatch;
    });

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
            {/* ── Header Actions ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div></div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 dark:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus className="w-5 h-5" />
                        Yeni Soru Ekle
                    </button>
                    <Link
                        href="/admin/exam-results"
                        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                    >
                        <Trophy className="w-5 h-5 text-orange-500" />
                        Sınav Sonuçlarını Görüntüle
                    </Link>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Soru metni veya şıklarda ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-600 outline-none transition-all"
                        />
                        <svg className="w-5 h-5 text-zinc-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center">
                        <select
                            value={selectedDifficulty}
                            onChange={(e) => setSelectedDifficulty(e.target.value)}
                            className="px-4 py-2 bg-transparent font-bold outline-none text-sm"
                        >
                            <option value="Tümü">Zorluk: Tümü</option>
                            {DIFFICULTIES.map(diff => (
                                <option key={diff} value={diff}>{diff}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                        <button
                            onClick={() => setSelectedCategory("Tümü")}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedCategory === "Tümü"
                                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                                }`}
                        >
                            Tüm Kategoriler
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedCategory === cat
                                    ? "bg-red-600 text-white shadow-md shadow-red-100"
                                    : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-400"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Questions List ── */}
            <div className="relative">
                {paginatedQuestions.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-12 text-center border border-zinc-200 dark:border-zinc-800">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                            {questions.length === 0 ? "Henüz soru eklenmemiş" : "Eşleşen soru bulunamadı"}
                        </h3>
                        <p className="text-zinc-500 dark:text-zinc-400 italic mb-6">
                            {questions.length === 0
                                ? "Soru havuzuna yeni soru eklemek için \"Yeni Soru Ekle\" butonuna tıklayın."
                                : "Filtrelerinizi değiştirerek tekrar deneyin."}
                        </p>
                        {questions.length === 0 && (
                            <button
                                onClick={() => handleOpenModal()}
                                className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
                            >
                                <Plus className="w-4 h-4 inline mr-2" />
                                İlk Soruyu Ekle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedQuestions.map((question) => (
                            <div key={question.id} className="bg-white dark:bg-zinc-900 rounded-3xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-800 hover:border-red-300 dark:hover:border-red-900/50 transition-all duration-300 group flex flex-col hover:-translate-y-1 hover:shadow-2xl">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex flex-wrap gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${getDifficultyColor(question.difficulty)}`}>
                                            {question.difficulty}
                                        </span>
                                        {question.questionType === "TRUE_FALSE" && (
                                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">D/Y</span>
                                        )}
                                        {question.questionType === "FILL_IN_BLANK" && (
                                            <span className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">BOŞLUK</span>
                                        )}
                                        {question.category && (
                                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase truncate max-w-[120px]" title={question.category}>
                                                {question.category}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-zinc-300 dark:text-zinc-700 font-black text-sm">
                                        #{question.id}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-snug mb-6 flex-1">
                                    {question.questionText}
                                </h3>
                                
                                <div className="space-y-3 mt-auto">
                                    {question.questionType === "FILL_IN_BLANK" ? (
                                        <div className="flex items-center gap-3 p-2.5 rounded-xl border bg-teal-50/50 border-teal-200 dark:bg-teal-900/10 dark:border-teal-800/50">
                                            <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
                                            <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                                                Cevap: {question.correctAnswer}
                                            </span>
                                        </div>
                                    ) : (
                                        (['A', 'B', 'C', 'D'] as const).map((key) => {
                                            const val = question[`option${key}` as keyof Question] as string;
                                            if (!val && (key === 'C' || key === 'D')) return null;

                                            const isCorrect = question.correctAnswer === key;
                                            return (
                                                <div
                                                    key={key}
                                                    className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isCorrect
                                                        ? 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800/50'
                                                        : 'bg-zinc-50/50 border-transparent dark:bg-zinc-800/20 dark:border-transparent'
                                                        }`}
                                                >
                                                    <span className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isCorrect
                                                        ? 'bg-green-600 text-white shadow-sm shadow-green-200'
                                                        : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                                                        }`}>
                                                        {key}
                                                    </span>
                                                    <span className={`text-xs font-bold line-clamp-2 ${isCorrect
                                                        ? 'text-green-700 dark:text-green-400'
                                                        : 'text-zinc-600 dark:text-zinc-400'
                                                        }`} title={val}>
                                                        {val}
                                                    </span>
                                                    {isCorrect && (
                                                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto flex-shrink-0" />
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                                
                                {/* Hover Actions Overlay */}
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(question); }}
                                        className="p-2.5 bg-white text-blue-600 dark:bg-zinc-800 dark:text-blue-400 rounded-xl shadow-lg hover:bg-blue-50 transition-colors border border-zinc-100 dark:border-zinc-700"
                                        title="Düzenle"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(question.id); }}
                                        className="p-2.5 bg-white text-red-600 dark:bg-zinc-800 dark:text-red-400 rounded-xl shadow-lg hover:bg-red-50 transition-colors border border-zinc-100 dark:border-zinc-700"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Sayfa {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800">
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {editingQuestion ? "Soruyu Düzenle" : "Yeni Soru Ekle"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
                            >
                                <XCircle className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* Question Text */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">
                                    Soru Metni
                                </label>
                                <textarea
                                    required
                                    value={formData.questionText}
                                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                    className="w-full px-5 py-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-red-600 dark:focus:border-red-600 transition-all outline-none min-h-[120px]"
                                    placeholder="Soruyu buraya yazın..."
                                />
                            </div>

                            {/* Category & Difficulty */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">Kategori</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-red-600 outline-none transition-all"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">Zorluk</label>
                                    <select
                                        required
                                        value={formData.difficulty}
                                        onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-red-600 outline-none transition-all"
                                    >
                                        {DIFFICULTIES.map(diff => (
                                            <option key={diff} value={diff}>{diff}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">Soru Tipi</label>
                                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-2xl shadow-inner overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, questionType: "MULTIPLE_CHOICE", optionA: formData.optionA || "Seçenek A", optionB: formData.optionB || "Seçenek B", optionC: formData.optionC || "Seçenek C", optionD: formData.optionD || "Seçenek D", correctAnswer: ["A","B","C","D"].includes(formData.correctAnswer) ? formData.correctAnswer : "A" })}
                                        className={`flex-1 flex justify-center items-center py-3 text-xs font-black rounded-xl transition-all ${formData.questionType === "MULTIPLE_CHOICE" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                                    >
                                        4 ŞIKLI
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, questionType: "TRUE_FALSE", optionA: "Doğru", optionB: "Yanlış", optionC: "", optionD: "", correctAnswer: formData.correctAnswer === "B" ? "B" : "A" })}
                                        className={`flex-1 flex justify-center items-center py-3 text-xs font-black rounded-xl transition-all ${formData.questionType === "TRUE_FALSE" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                                    >
                                        D / Y
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, questionType: "FILL_IN_BLANK", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "" })}
                                        className={`flex-1 flex justify-center items-center py-3 text-xs font-black rounded-xl transition-all ${formData.questionType === "FILL_IN_BLANK" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"}`}
                                    >
                                        BOŞLUK
                                    </button>
                                </div>
                            </div>

                            {/* Options / Answer */}
                            {formData.questionType === "FILL_IN_BLANK" ? (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">
                                        Doğru Cevap
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.correctAnswer}
                                        onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                        className="w-full px-5 py-4 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-green-600 outline-none transition-all"
                                        placeholder="Boşluğa girilmesi gereken doğru cevabı yazın..."
                                    />
                                    <p className="text-xs text-zinc-400 pl-1">Kullanıcılar bu soruya yazılı yanıt verecektir.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">
                                        Seçenekler <span className="text-xs normal-case text-zinc-400">(doğru cevap için harfe tıklayın)</span>
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {(['A', 'B', 'C', 'D'] as const).map(key => {
                                            const isTF = formData.questionType === "TRUE_FALSE";
                                            if (isTF && (key === 'C' || key === 'D')) return null;

                                            return (
                                            <div key={key} className="flex gap-2">
                                                <div className="flex-1">
                                                    <input
                                                        required
                                                        type="text"
                                                        value={formData[`option${key}` as keyof typeof formData] as string}
                                                        onChange={(e) => setFormData({ ...formData, [`option${key}`]: e.target.value })}
                                                        readOnly={isTF}
                                                        className={`w-full px-4 py-3 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-red-600 outline-none transition-all ${isTF ? "opacity-70 cursor-not-allowed" : ""}`}
                                                        placeholder={`Seçenek ${key}`}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, correctAnswer: key })}
                                                    className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black transition-all ${formData.correctAnswer === key
                                                        ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200"
                                                        : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700 hover:border-green-300"
                                                        }`}
                                                >
                                                    {key}
                                                </button>
                                            </div>
                                        )})}
                                    </div>
                                    <p className="text-xs text-zinc-400 pl-1">
                                        Seçilen doğru cevap: <strong className="text-green-600">{formData.correctAnswer}</strong>
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-black text-lg shadow-xl shadow-red-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                                    {editingQuestion ? "Değişiklikleri Kaydet" : "Soruyu Havuza Ekle"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all font-bold"
                                >
                                    İptal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
