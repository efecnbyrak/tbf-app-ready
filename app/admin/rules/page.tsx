"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, FileText } from "lucide-react";

interface RuleBook {
    id: number;
    title: string;
    description: string | null;
    url: string;
    category: string | null;
    createdAt: string;
}

export default function AdminRulesPage() {
    const [rules, setRules] = useState<RuleBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState<"url" | "file">("file");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<RuleBook | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        category: "",
        description: ""
    });

    useEffect(() => {
        fetchRules();
    }, []);

    const fetchRules = async () => {
        try {
            const res = await fetch("/api/rules");
            if (res.ok) {
                const data = await res.json();
                setRules(data);
            }
        } catch (error) {
            console.error("Error fetching rules:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const endpoint = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";
            const method = editingRule ? "PUT" : "POST";

            let body: any;
            const headers: Record<string, string> = {};

            if (uploadType === "file" && file) {
                const formParams = new FormData();
                formParams.append("title", formData.title);
                formParams.append("category", formData.category);
                formParams.append("description", formData.description);
                formParams.append("file", file);
                body = formParams;
            } else {
                body = JSON.stringify(formData);
                headers["Content-Type"] = "application/json";
            }

            const res = await fetch(endpoint, {
                method,
                headers: Object.keys(headers).length > 0 ? headers : undefined,
                body
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingRule(null);
                setFormData({ title: "", url: "", category: "", description: "" });
                setFile(null);
                fetchRules();
            } else {
                alert("İşlem başarısız.");
            }
        } catch (error) {
            console.error("Error saving rule:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu kural kitabını silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/rules/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchRules();
            }
        } catch (error) {
            console.error("Error deleting rule:", error);
        }
    };

    const openEditModal = (rule: RuleBook) => {
        setEditingRule(rule);
        setFormData({
            title: rule.title,
            url: rule.url,
            category: rule.category || "",
            description: rule.description || ""
        });
        setUploadType("url"); // Edit mode defaults to URL display usually
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingRule(null);
        setFormData({ title: "", url: "", category: "", description: "" });
        setFile(null);
        setUploadType("file");
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    Kural Kitabı Yönetimi
                </h1>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Doküman Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => (
                    <div key={rule.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {rule.title}
                                    </h3>
                                    <span className="text-xs text-zinc-500">
                                        {rule.category || "Genel"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => openEditModal(rule)}
                                    className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(rule.id)}
                                    className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <p className="mt-4 text-sm text-zinc-500 line-clamp-2">
                            {rule.description || "Açıklama yok"}
                        </p>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-xs text-zinc-400">
                                {new Date(rule.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                            <a
                                href={rule.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-red-600 hover:underline font-medium"
                            >
                                Görüntüle
                            </a>
                        </div>
                    </div>
                ))}

                {rules.length === 0 && !isLoading && (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        Henüz hiç doküman eklenmemiş.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {editingRule ? "Doküman Düzenle" : "Yeni Doküman Ekle"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Başlık
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Örn: 2024 Oyun Kuralları"
                                />
                            </div>

                            {!editingRule && (
                                <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg mb-2">
                                    <button
                                        type="button"
                                        onClick={() => setUploadType("file")}
                                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${uploadType === "file" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                                    >
                                        Dosya Yükle
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setUploadType("url")}
                                        className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${uploadType === "url" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500"}`}
                                    >
                                        Harici Bağlantı
                                    </button>
                                </div>
                            )}

                            {uploadType === "file" && !editingRule ? (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        PDF Dosyası
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        required
                                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        className="w-full text-sm text-zinc-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-red-50 file:text-red-700
                                        hover:file:bg-red-100 dark:file:bg-red-900/20"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                        Dosya URL
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.url}
                                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                        placeholder="https://..."
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Kategori
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 bg-white"
                                >
                                    <option value="">Seçiniz</option>
                                    <option value="Oyun Kuralları">Oyun Kuralları</option>
                                    <option value="Yorumlar">Yorumlar</option>
                                    <option value="Mekanik">Mekanik</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Açıklama
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 resize-none"
                                    placeholder="Doküman hakkında kısa bilgi..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? "Kaydediliyor..." : (editingRule ? "Değişiklikleri Kaydet" : "Ekle")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
