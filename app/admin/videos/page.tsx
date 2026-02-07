"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit, Save, X, Search, Eye, FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface VideoCategory {
    id: number;
    name: string;
    description: string | null;
    displayOrder: number;
    _count?: { videos: number };
    createdAt: string;
}

interface Video {
    id: number;
    title: string;
    url: string;
    category: string | null;
    description: string | null;
    duration: number;
    viewCount: number;
    createdAt: string;
    videoCategory?: VideoCategory | null;
    videoCategoryId?: number | null;
}

export default function AdminVideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<VideoCategory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

    // Form State
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        url: "",
        videoCategoryId: "",
        description: "",
        duration: 0
    });

    // Category Form State
    const [categoryFormData, setCategoryFormData] = useState({
        name: "",
        description: "",
        displayOrder: 0
    });

    useEffect(() => {
        fetchVideos();
        fetchCategories();
    }, []);

    const fetchVideos = async () => {
        try {
            const res = await fetch("/api/videos");
            if (res.ok) {
                const data = await res.json();
                setVideos(data);
            }
        } catch (error) {
            console.error("Error fetching videos:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await fetch("/api/videos/categories");
            if (res.ok) {
                const data = await res.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const endpoint = editingVideo ? `/api/videos/${editingVideo.id}` : "/api/videos";
            const method = editingVideo ? "PUT" : "POST";

            const res = await fetch(endpoint, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setEditingVideo(null);
                setFormData({ title: "", url: "", videoCategoryId: "", description: "", duration: 0 });
                fetchVideos();
            } else {
                alert("İşlem başarısız.");
            }
        } catch (error) {
            console.error("Error saving video:", error);
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/videos/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(categoryFormData)
            });

            if (res.ok) {
                setIsCategoryModalOpen(false);
                setCategoryFormData({ name: "", description: "", displayOrder: 0 });
                fetchCategories();
                alert("Kategori başarıyla oluşturuldu!");
            } else {
                alert("Kategori oluşturulamadı.");
            }
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu videoyu silmek istediğinize emin misiniz?")) return;
        try {
            const res = await fetch(`/api/videos/${id}`, { method: "DELETE" });
            if (res.ok) {
                fetchVideos();
            }
        } catch (error) {
            console.error("Error deleting video:", error);
        }
    };

    const openEditModal = (video: Video) => {
        setEditingVideo(video);
        setFormData({
            title: video.title,
            url: video.url,
            videoCategoryId: video.videoCategoryId?.toString() || "",
            description: video.description || "",
            duration: video.duration
        });
        setIsModalOpen(true);
    };

    const openAddModal = () => {
        setEditingVideo(null);
        setFormData({ title: "", url: "", videoCategoryId: "", description: "", duration: 0 });
        setIsModalOpen(true);
    };

    // YouTube Thumbnail Helper
    const getThumbnail = (url: string) => {
        try {
            let videoId = null;
            if (url.includes("v=")) {
                videoId = url.split("v=")[1]?.split("&")[0];
            } else if (url.includes("youtu.be/")) {
                videoId = url.split("youtu.be/")[1];
            }
            if (videoId) return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        } catch (e) {
            return null;
        }
        return null;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                        Eğitim Videoları Yönetimi
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        {videos.length} video • {categories.length} kategori
                    </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setIsCategoryModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        <FolderPlus className="w-4 h-4" />
                        Kategori Ekle
                    </button>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Video Ekle
                    </button>
                </div>
            </div>

            {/* Categories Display */}
            {categories.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
                    <h3 className="font-semibold text-sm uppercase text-zinc-500 mb-3">Kategoriler</h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <div key={cat.id} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm flex items-center gap-2">
                                <span className="font-medium">{cat.name}</span>
                                <span className="text-zinc-500">({cat._count?.videos || 0})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                    <div key={video.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-800">
                            {getThumbnail(video.url) ? (
                                <Image
                                    src={getThumbnail(video.url)!}
                                    alt={video.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-zinc-400">
                                    Görsel Yok
                                </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                            </div>
                            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {video.viewCount}
                            </div>
                        </div>

                        <div className="p-4">
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2 flex-1">
                                    {video.title}
                                </h3>
                                <div className="flex gap-1 shrink-0">
                                    <button
                                        onClick={() => openEditModal(video)}
                                        className="p-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(video.id)}
                                        className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-zinc-500 line-clamp-2 mb-3">
                                {video.description || "Açıklama yok"}
                            </p>
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                                    {video.videoCategory?.name || video.category || "Kategori Yok"}
                                </span>
                                <span>{new Date(video.createdAt).toLocaleDateString("tr-TR")}</span>
                            </div>
                        </div>
                    </div>
                ))}

                {videos.length === 0 && !isLoading && (
                    <div className="col-span-full py-12 text-center text-zinc-500">
                        Henüz hiç video eklenmemiş.
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {editingVideo ? "Video Düzenle" : "Yeni Video Ekle"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Video Başlığı
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Örn: Hakem Mekaniği - Bölüm 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    YouTube URL
                                </label>
                                <input
                                    type="url"
                                    required
                                    value={formData.url}
                                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Kategori
                                </label>
                                <select
                                    value={formData.videoCategoryId}
                                    onChange={(e) => setFormData({ ...formData, videoCategoryId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 bg-white"
                                >
                                    <option value="">Kategori Seç</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-zinc-500 mt-1">
                                    Yeni kategori eklemek için "Kategori Ekle" butonunu kullanın.
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Süre (Saniye)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.duration}
                                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Örn: 600 (10dk)"
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    Tahmini süre. 10 dk için 600 yazınız.
                                </p>
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
                                    placeholder="Video içeriği hakkında kısa bilgi..."
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                {editingVideo ? "Değişiklikleri Kaydet" : "Video Ekle"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                                Yeni Kategori Ekle
                            </h3>
                            <button onClick={() => setIsCategoryModalOpen(false)} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCategorySubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Kategori Adı
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={categoryFormData.name}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Örn: Hakem Mekaniği"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Açıklama (Opsiyonel)
                                </label>
                                <textarea
                                    rows={2}
                                    value={categoryFormData.description}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700 resize-none"
                                    placeholder="Kategori açıklaması..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                    Sıralama (0 = En Üstte)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={categoryFormData.displayOrder}
                                    onChange={(e) => setCategoryFormData({ ...categoryFormData, displayOrder: parseInt(e.target.value) || 0 })}
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:bg-zinc-800 dark:border-zinc-700"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                Kategori Oluştur
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
