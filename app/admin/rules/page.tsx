"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, FileText, Upload } from "lucide-react";

interface RuleBook {
    id: number;
    title: string;
    description: string | null;
    content: string | null;
    url: string | null;
    category: string | null;
    createdAt: string;
}

export default function AdminRulesPage() {
    const [rules, setRules] = useState<RuleBook[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<RuleBook | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        description: "",
        content: "" // JSON content
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadType, setUploadType] = useState<"PDF" | "JSON">("PDF");

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

        if (uploadType === "PDF" && !selectedFile && !editingRule) {
            alert("Lütfen bir PDF dosyası seçin");
            return;
        }

        if (uploadType === "JSON" && !formData.content && !editingRule) {
            alert("Lütfen JSON içeriğini girin");
            return;
        }

        setIsSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("category", formData.category);
            formDataToSend.append("description", formData.description);
            formDataToSend.append("type", uploadType);

            if (uploadType === "PDF" && selectedFile) {
                formDataToSend.append("file", selectedFile);
            } else if (uploadType === "JSON") {
                formDataToSend.append("jsonContent", formData.content);
            }

            const endpoint = editingRule ? `/api/rules/${editingRule.id}` : "/api/rules";
            const method = editingRule ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                body: formDataToSend
            });

            if (res.ok) {
                alert("Kural kitabı başarıyla kaydedildi!");
                setIsModalOpen(false);
                setEditingRule(null);
                setFormData({ title: "", category: "", description: "", content: "" });
                setSelectedFile(null);
                fetchRules();
            } else {
                const data = await res.json();
                alert(data.error || "İşlem başarısız.");
            }
        } catch (error) {
            console.error("Error saving rule:", error);
            alert("Hata oluştu.");
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
            category: rule.category || "",
            description: rule.description || "",
            content: rule.content || ""
        });
        setSelectedFile(null);
        setUploadType(rule.url ? "PDF" : "JSON");
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingRule(null);
        setFormData({ title: "", category: "", description: "", content: "" });
        setSelectedFile(null);
        setUploadType("PDF");
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
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg"
                >
                    <Plus className="w-4 h-4" />
                    Yeni Doküman Ekle
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rules.map((rule) => (
                    <div key={rule.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {rule.title}
                                    </h3>
                                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                                        {rule.category || "Genel"}
                                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                                        {rule.url ? "PDF" : "Dijital"}
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

                        <p className="mt-4 text-sm text-zinc-500 line-clamp-2 italic">
                            {rule.description || "Açıklama yok"}
                        </p>

                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                            <span className="text-xs text-zinc-400">
                                {new Date(rule.createdAt).toLocaleDateString("tr-TR")}
                            </span>
                            {rule.url ? (
                                <a
                                    href={rule.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-red-600 hover:underline font-medium"
                                >
                                    Görüntüle (PDF)
                                </a>
                            ) : (
                                <span className="text-sm text-blue-600 font-medium">
                                    Dijital İçerik
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {rules.length === 0 && !isLoading && (
                    <div className="col-span-full py-20 text-center text-zinc-500 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        Henüz hiç doküman eklenmemiş.
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                    {editingRule ? "Doküman Düzenle" : "Yeni Doküman Ekle"}
                                </h3>
                                <p className="text-sm text-zinc-500 mt-0.5">Kural kitabı veya yorum dökümanı</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-all">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                        Başlık
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-950 transition-all"
                                        placeholder="Örn: 2024 Oyun Kuralları"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                        Kategori
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-950 transition-all"
                                    >
                                        <option value="">Seçiniz</option>
                                        <option value="Oyun Kuralları">Oyun Kuralları</option>
                                        <option value="Yorumlar">Yorumlar</option>
                                        <option value="Mekanik">Mekanik</option>
                                        <option value="Diğer">Diğer</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                        Yükleme Tipi
                                    </label>
                                    <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800">
                                        <button
                                            type="button"
                                            onClick={() => setUploadType("PDF")}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${uploadType === "PDF" ? "bg-white dark:bg-zinc-800 shadow-sm text-red-600" : "text-zinc-500"}`}
                                        >
                                            PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setUploadType("JSON")}
                                            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${uploadType === "JSON" ? "bg-white dark:bg-zinc-800 shadow-sm text-blue-600" : "text-zinc-500"}`}
                                        >
                                            JSON
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {uploadType === "PDF" ? (
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                        PDF Dosyası
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="pdf-upload"
                                            required={!editingRule && uploadType === "PDF"}
                                        />
                                        <label
                                            htmlFor="pdf-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl cursor-pointer hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/5 transition-all"
                                        >
                                            <Upload className="w-8 h-8 text-zinc-400 group-hover:text-red-600 mb-2" />
                                            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                                                {selectedFile ? selectedFile.name : (editingRule && editingRule.url ? "Yeni PDF seçmek için tıkla" : "PDF Dosyası Seç")}
                                            </span>
                                            <span className="text-xs text-zinc-400 mt-1">Sadece .pdf (Max 10MB)</span>
                                        </label>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                        JSON İçeriği
                                    </label>
                                    <textarea
                                        rows={8}
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-950 font-mono text-xs leading-relaxed"
                                        placeholder={`[
  {
    "section": "BÖLÜM 1",
    "h1": "OYUN KURALLARI",
    "p": "Basketbol oyunu beşer kişilik..."
  }
]`}
                                    />
                                    <p className="text-[10px] text-zinc-400 mt-1.5 ml-1">
                                        JSON formatında <strong>section</strong>, <strong>h1</strong> ve <strong>p</strong> alanlarını içeren bir dizi yapıştırın.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 ml-1">
                                    Açıklama
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-950 transition-all resize-none"
                                    placeholder="Doküman hakkında kısa bilgi..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-100 dark:shadow-none mt-2"
                            >
                                {isSubmitting ? "Kaydediliyor..." : (editingRule ? "DEĞİŞİKLİKLERİ KAYDET" : "ŞİMDİ YÜKLE VE YAYINLA")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
