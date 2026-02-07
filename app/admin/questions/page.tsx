"use client";

import { useState, useEffect } from "react";
import {
    getAllQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
} from "@/app/actions/admin-exam";
import { Plus, Edit, Trash2, Loader2, CheckCircle, XCircle } from "lucide-react";

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

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("Tümü");
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Tümü");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [formData, setFormData] = useState({
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A",
        category: CATEGORIES[0],
        difficulty: "Orta",
    });

    useEffect(() => {
        loadQuestions();
    }, []);

    useEffect(() => {
        setCurrentPage(1); // Reset page on filter change
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
                category: question.category || CATEGORIES[0],
                difficulty: question.difficulty || "Orta",
            });
        } else {
            setEditingQuestion(null);
            setFormData({
                questionText: "",
                optionA: "",
                optionB: "",
                optionC: "",
                optionD: "",
                correctAnswer: "A",
                category: CATEGORIES[0],
                difficulty: "Orta",
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (editingQuestion) {
            const result = await updateQuestion(editingQuestion.id, formData);
            if (result.success) {
                await loadQuestions();
                setShowModal(false);
                alert("Soru başarıyla güncellendi!");
            } else {
                alert(result.error);
            }
        } else {
            const result = await createQuestion(formData);
            if (result.success) {
                await loadQuestions();
                setShowModal(false);
                alert("Soru başarıyla eklendi!");
            } else {
                alert(result.error);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu soruyu silmek istediğinizden emin misiniz?")) return;

        const result = await deleteQuestion(id);
        if (result.success) {
            await loadQuestions();
            alert("Soru silindi!");
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
    const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
            {/* ... Header ... */}

            {/* Filter & Search Bar */}
            <div className="mb-8 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Soru metni veya şıklarda ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-600 outline-none transition-all"
                        />
                        <svg className="w-5 h-5 text-zinc-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>

                    {/* Difficulty Filter (Existing) */}
                    <div className="bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center">
                        {/* ... existing difficulty buttons ... */}
                        <div className="flex gap-2">
                            {/* ... kept existing ... */}
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
                </div>

                {/* Category Filter (Existing but slightly compact) */}
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

            {/* Questions Grid/List */}
            <div className="space-y-6">
                {paginatedQuestions.length === 0 ? (
                    // ... Empty State ...
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-12 text-center border border-zinc-200 dark:border-zinc-800">
                        <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-8 h-8 text-zinc-400" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">Eşleşen soru bulunamadı</h3>
                        <p className="text-zinc-500 dark:text-zinc-400 italic">
                            Filtrelerinizi değiştirerek tekrar deneyin.
                        </p>
                    </div>
                ) : (
                    paginatedQuestions.map((question, index) => (
                        // ... Existing Question Card ...
                        <div key={question.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm p-6 border border-zinc-200 dark:border-zinc-800 hover:border-red-200 dark:hover:border-red-900/30 transition-all group">
                            {/* ... Content ... */}
                            <div className="flex items-start justify-between gap-6">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-4">
                                        <span className="bg-zinc-900 text-white dark:bg-zinc-700 px-3 py-1 rounded-full text-xs font-black tracking-tighter">
                                            #{question.id}
                                        </span>
                                        {/* ... rest of content ... */}
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(question.difficulty)}`}>
                                            {question.difficulty}
                                        </span>
                                        {question.category && (
                                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-3 py-1 rounded-full text-xs font-bold">
                                                {question.category}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight mb-6">
                                        {question.questionText}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { key: 'A', val: question.optionA },
                                            { key: 'B', val: question.optionB },
                                            { key: 'C', val: question.optionC },
                                            { key: 'D', val: question.optionD }
                                        ].map((opt) => (
                                            <div
                                                key={opt.key}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${question.correctAnswer === opt.key
                                                    ? 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800'
                                                    : 'bg-zinc-50 border-zinc-100 dark:bg-zinc-800/50 dark:border-zinc-800'
                                                    }`}
                                            >
                                                <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-black ${question.correctAnswer === opt.key
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400'
                                                    }`}>
                                                    {opt.key}
                                                </span>
                                                <span className={`text-sm font-medium ${question.correctAnswer === opt.key
                                                    ? 'text-green-700 dark:text-green-400'
                                                    : 'text-zinc-600 dark:text-zinc-400'
                                                    }`}>
                                                    {opt.val}
                                                </span>
                                                {question.correctAnswer === opt.key && (
                                                    <CheckCircle className="w-5 h-5 text-green-600 ml-auto flex-shrink-0" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 transition-opacity">
                                    <button
                                        onClick={() => handleOpenModal(question)}
                                        className="p-3 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"
                                        title="Düzenle"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(question.id)}
                                        className="p-3 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"
                                        title="Sil"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>

                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                        Sayfa {currentPage} / {totalPages}
                    </span>

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 disabled:opacity-50 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            )}

            {/* Modal Logic (Existing) */}
            {showModal && (
                // ... Existing Modal ...
                <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
                        {/* ... header ... */}
                        <div className="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
                                {editingQuestion ? "Soruyu Düzenle" : "Yeni Soru Ekle"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                                <XCircle className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>
                        {/* ... form ... */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {/* ... kept existing ... */}
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
                            {/* ... rest of form ... */}
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

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-zinc-500 uppercase tracking-widest pl-1">Seçenekler</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['A', 'B', 'C', 'D'].map(key => (
                                        <div key={key} className="flex gap-2">
                                            <div className="flex-1">
                                                <input
                                                    required
                                                    type="text"
                                                    value={formData[`option${key}` as keyof typeof formData]}
                                                    onChange={(e) => setFormData({ ...formData, [`option${key}`]: e.target.value })}
                                                    className="w-full px-4 py-3 border-2 border-zinc-100 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:border-red-600 outline-none transition-all"
                                                    placeholder={`Seçenek ${key}`}
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, correctAnswer: key })}
                                                className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black transition-all ${formData.correctAnswer === key
                                                    ? "bg-green-600 border-green-600 text-white shadow-lg shadow-green-200"
                                                    : "bg-zinc-100 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700"
                                                    }`}
                                            >
                                                {key}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-8 py-4 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all font-black text-lg shadow-xl shadow-red-200 dark:shadow-none hover:scale-[1.02] active:scale-[0.98]"
                                >
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
