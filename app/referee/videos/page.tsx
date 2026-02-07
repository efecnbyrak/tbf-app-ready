"use client";

import { useEffect, useState } from "react";
import { PlayCircle, CheckCircle, Clock, Eye, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

interface VideoCategory {
    id: number;
    name: string;
    description: string | null;
    displayOrder: number;
}

interface Video {
    id: number;
    title: string;
    url: string;
    description: string | null;
    duration: number;
    viewCount: number;
    videoCategory?: VideoCategory | null;
    category?: string | null;
}

export default function VideosPage() {
    const [videos, setVideos] = useState<Video[]>([]);
    const [categories, setCategories] = useState<VideoCategory[]>([]);
    const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [videosRes, categoriesRes] = await Promise.all([
                fetch("/api/videos"),
                fetch("/api/videos/categories")
            ]);

            if (videosRes.ok) {
                const videosData = await videosRes.json();
                setVideos(videosData);
            }

            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData);
                // Auto-expand all categories
                setExpandedCategories(new Set(categoriesData.map((c: VideoCategory) => c.id)));
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleCategory = (categoryId: number) => {
        setExpandedCategories(prev => {
            const newSet = new Set(prev);
            if (newSet.has(categoryId)) {
                newSet.delete(categoryId);
            } else {
                newSet.add(categoryId);
            }
            return newSet;
        });
    };

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

    // Group videos by category
    const videosByCategory = categories.map(cat => ({
        category: cat,
        videos: videos.filter(v => v.videoCategory?.id === cat.id)
    }));

    // Uncategorized videos
    const uncategorizedVideos = videos.filter(v => !v.videoCategory);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    if (videos.length === 0) {
        return (
            <div className="text-center py-12">
                <PlayCircle className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Henüz Video Eklenmemiş
                </h2>
                <p className="text-zinc-500">
                    Yönetici eğitim videoları eklendiğinde burada görünecektir.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Eğitim Videoları</h1>
                <p className="text-zinc-500">
                    Hakemlik becerilerinizi geliştirmek için kategorilere ayrılmış eğitim videoları
                </p>
            </div>

            {/* Categorized Videos */}
            {videosByCategory.map(({ category, videos: categoryVideos }) => {
                if (categoryVideos.length === 0) return null;

                const isExpanded = expandedCategories.has(category.id);

                return (
                    <div key={category.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <PlayCircle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                        {category.name}
                                    </h2>
                                    {category.description && (
                                        <p className="text-sm text-zinc-500">{category.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-zinc-500 font-medium">
                                    {categoryVideos.length} video
                                </span>
                                {isExpanded ? (
                                    <ChevronUp className="w-5 h-5 text-zinc-400" />
                                ) : (
                                    <ChevronDown className="w-5 h-5 text-zinc-400" />
                                )}
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryVideos.map((video) => (
                                        <Link
                                            key={video.id}
                                            href={`/referee/videos/${video.id}`}
                                            className="group block bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg hover:border-red-200 dark:hover:border-red-900 transition-all"
                                        >
                                            <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 relative">
                                                {getThumbnail(video.url) ? (
                                                    <img
                                                        src={getThumbnail(video.url)!}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-400">
                                                        <PlayCircle className="w-12 h-12" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                    <PlayCircle className="w-12 h-12 text-white fill-red-600" />
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                                </div>
                                                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {video.viewCount}
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-semibold text-sm line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors">
                                                    {video.title}
                                                </h3>
                                                {video.description && (
                                                    <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                                                        {video.description}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Uncategorized Videos */}
            {uncategorizedVideos.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                            Diğer Videolar
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {uncategorizedVideos.map((video) => (
                                <Link
                                    key={video.id}
                                    href={`/referee/videos/${video.id}`}
                                    className="group block bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg hover:border-red-200 dark:hover:border-red-900 transition-all"
                                >
                                    <div className="aspect-video bg-zinc-200 dark:bg-zinc-700 relative">
                                        {getThumbnail(video.url) ? (
                                            <img
                                                src={getThumbnail(video.url)!}
                                                alt={video.title}
                                                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-zinc-400">
                                                <PlayCircle className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                            <PlayCircle className="w-12 h-12 text-white fill-red-600" />
                                        </div>
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                        </div>
                                        <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {video.viewCount}
                                        </div>
                                    </div>
                                    <div className="p-3">
                                        <h3 className="font-semibold text-sm line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors">
                                            {video.title}
                                        </h3>
                                        {video.description && (
                                            <p className="text-xs text-zinc-500 line-clamp-2 mt-1">
                                                {video.description}
                                            </p>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
