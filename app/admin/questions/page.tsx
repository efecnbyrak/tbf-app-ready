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

interface Question {
    id: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    category?: string;
}

export default function QuestionsPage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
    const [selectedFilter, setSelectedFilter] = useState<string>("Tümü");
    const [formData, setFormData] = useState({
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "A",
        category: CATEGORIES[0],
    });

    useEffect(() => {
        loadQuestions();
    }, []);

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

    const filteredQuestions = selectedFilter === "Tümü"
        ? questions
        : questions.filter(q => q.category === selectedFilter);

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
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        Soru Havuzu Yönetimi
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Toplam {questions.length} soru - Her sınavda 20 rastgele soru seçilir
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-md hover:shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Soru Ekle
                </button>
            </div>

            {/* Filter Bar */}
            <div className="mb-6 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                    <button
                        onClick={() => setSelectedFilter("Tümü")}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedFilter === "Tümü"
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                            }`}
                    >
                        Tümü ({questions.length})
                    </button>
                    {CATEGORIES.map(cat => {
                        const count = questions.filter(q => q.category === cat).length;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedFilter(cat)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedFilter === cat
                                    ? "bg-red-600 text-white"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                                    }`}
                            >
                                {cat} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
                {filteredQuestions.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-8 text-center border border-zinc-200 dark:border-zinc-800">
                        <p className="text-zinc-600 dark:text-zinc-400">
                            {selectedFilter === "Tümü"
                                ? "Henüz soru eklenmemiş. Yukarıdaki butondan soru ekleyin."
                                : `${selectedFilter} kategorisinde henüz soru yok.`}
                        </p>
                    </div>
                ) : (
                    filteredQuestions.map((question, index) => (
                        <div
                            key={question.id}
                            className="bg-white dark:bg-zinc-900 rounded-lg shadow p-6 border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded text-sm font-bold">
                                            Soru #{index + 1}
                                        </span>
                                        {question.category && (
                                            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded text-xs">
                                                {question.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-zinc-900 dark:text-zinc-100 font-medium mb-3 break-words">
                                        {question.questionText}
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-start gap-2">
                                            <span className={`font-bold ${question.correctAnswer === 'A' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                                                A)
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{question.optionA}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className={`font-bold ${question.correctAnswer === 'B' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                                                B)
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{question.optionB}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className={`font-bold ${question.correctAnswer === 'C' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                                                C)
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{question.optionC}</span>
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className={`font-bold ${question.correctAnswer === 'D' ? 'text-green-600 dark:text-green-400' : 'text-zinc-500'}`}>
                                                D)
                                            </span>
                                            <span className="text-zinc-700 dark:text-zinc-300">{question.optionD}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                        onClick={() => handleOpenModal(question)}
                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    >
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(question.id)}
                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                {editingQuestion ? "Soru Düzenle" : "Yeni Soru Ekle"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Soru Metni *
                                </label>
                                <textarea
                                    required
                                    value={formData.questionText}
                                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                                    className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Kategori *
                                    </label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Doğru Cevap *
                                    </label>
                                    <select
                                        required
                                        value={formData.correctAnswer}
                                        onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Seçenek A *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.optionA}
                                        onChange={(e) => setFormData({ ...formData, optionA: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Seçenek B *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.optionB}
                                        onChange={(e) => setFormData({ ...formData, optionB: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Seçenek C *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.optionC}
                                        onChange={(e) => setFormData({ ...formData, optionC: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Seçenek D *
                                    </label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.optionD}
                                        onChange={(e) => setFormData({ ...formData, optionD: e.target.value })}
                                        className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                                >
                                    {editingQuestion ? "Güncelle" : "Ekle"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors font-medium"
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
