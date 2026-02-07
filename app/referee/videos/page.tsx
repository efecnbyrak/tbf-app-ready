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
import { getYouTubeThumbnail } from "@/lib/youtube-utils";

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
                    <div key={category.id} className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <button
                            onClick={() => toggleCategory(category.id)}
                            className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-red-50/50 hover:to-transparent dark:hover:from-red-900/10 dark:hover:to-transparent transition-all duration-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                                    <PlayCircle className="w-7 h-7 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                                        {category.name}
                                    </h2>
                                    {category.description && (
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{category.description}</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-zinc-600 dark:text-zinc-400 font-semibold bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                                    {categoryVideos.length} video
                                </span>
                                {isExpanded ? (
                                    <ChevronUp className="w-6 h-6 text-red-600 dark:text-red-500" />
                                ) : (
                                    <ChevronDown className="w-6 h-6 text-zinc-400" />
                                )}
                            </div>
                        </button>

                        {isExpanded && (
                            <div className="px-6 py-5 bg-gradient-to-b from-zinc-50/50 to-transparent dark:from-zinc-800/20 dark:to-transparent border-t border-zinc-100 dark:border-zinc-800">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {categoryVideos.map((video) => (
                                        <Link
                                            key={video.id}
                                            href={`/referee/videos/${video.id}`}
                                            className="group block bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-2xl hover:shadow-red-600/10 dark:hover:shadow-red-500/20 hover:border-red-300 dark:hover:border-red-800 transition-all duration-300 transform hover:-translate-y-1"
                                        >
                                            <div className="aspect-video bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                                                {getYouTubeThumbnail(video.url) ? (
                                                    <img
                                                        src={getYouTubeThumbnail(video.url)!}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-zinc-400">
                                                        <PlayCircle className="w-12 h-12" />
                                                    </div>
                                                )}
                                                {/* Gradient overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                {/* Play button overlay */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                    <div className="bg-red-600 rounded-full p-4 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                                                        <PlayCircle className="w-10 h-10 text-white fill-white" />
                                                    </div>
                                                </div>
                                                {/* Duration badge */}
                                                <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                                                    <Clock className="w-3 h-3" />
                                                    {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                                </div>
                                                {/* View count badge */}
                                                <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-800 dark:text-zinc-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                                                    <Eye className="w-3 h-3" />
                                                    {video.viewCount}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-base line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors duration-200 mb-2">
                                                    {video.title}
                                                </h3>
                                                {video.description && (
                                                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
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
                                    className="group block bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-2xl hover:shadow-red-600/10 dark:hover:shadow-red-500/20 hover:border-red-300 dark:hover:border-red-800 transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    <div className="aspect-video bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                                        {getYouTubeThumbnail(video.url) ? (
                                            <img
                                                src={getYouTubeThumbnail(video.url)!}
                                                alt={video.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-zinc-400">
                                                <PlayCircle className="w-12 h-12" />
                                            </div>
                                        )}
                                        {/* Gradient overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                        {/* Play button overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="bg-red-600 rounded-full p-4 shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                                                <PlayCircle className="w-10 h-10 text-white fill-white" />
                                            </div>
                                        </div>
                                        {/* Duration badge */}
                                        <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                                            <Clock className="w-3 h-3" />
                                            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                        </div>
                                        {/* View count badge */}
                                        <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-800 dark:text-zinc-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                                            <Eye className="w-3 h-3" />
                                            {video.viewCount}
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-base line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-red-700 dark:group-hover:text-red-500 transition-colors duration-200 mb-2">
                                            {video.title}
                                        </h3>
                                        {video.description && (
                                            <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
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
