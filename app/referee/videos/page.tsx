import { PlayCircle, Clock, Eye, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { getYouTubeThumbnail } from "@/lib/youtube-utils";
import { db } from "@/lib/db";
import Image from "next/image";

export const revalidate = 3600; // Revalidate every hour

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

function formatDuration(seconds: number) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function VideoCard({ video }: { video: Video }) {
    const thumb = getYouTubeThumbnail(video.url);

    return (
        <a
            href={video.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-2xl hover:shadow-red-600/10 dark:hover:shadow-red-500/20 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300 transform hover:-translate-y-1"
        >
            {/* Thumbnail */}
            <div className="aspect-video bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-900 relative overflow-hidden">
                {thumb ? (
                    <Image
                        src={thumb}
                        alt={video.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-zinc-400">
                        <PlayCircle className="w-14 h-14" />
                    </div>
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* YouTube play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="relative">
                        {/* YouTube-style red play btn */}
                        <div className="w-16 h-16 bg-red-600 rounded-2xl flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform duration-300">
                            <svg viewBox="0 0 24 24" fill="white" className="w-8 h-8 ml-1">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* YouTube badge - bottom left */}
                <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1 shadow-lg uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ExternalLink className="w-3 h-3" />
                    YouTube&apos;da Aç
                </div>

                {/* Duration badge */}
                {video.duration > 0 && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                        <Clock className="w-3 h-3" />
                        {formatDuration(video.duration)}
                    </div>
                )}

                {/* View count */}
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm text-zinc-800 dark:text-zinc-200 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-lg">
                    <Eye className="w-3 h-3" />
                    {video.viewCount}
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-bold text-base line-clamp-2 text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors duration-200 mb-1.5 leading-snug">
                    {video.title}
                </h3>
                {video.description && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                        {video.description}
                    </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ExternalLink className="w-3.5 h-3.5" />
                    YouTube&apos;da izle
                </div>
            </div>
        </a>
    );
}

export default async function VideosPage() {
    const [videos, categories] = await Promise.all([
        db.video.findMany({
            include: { videoCategory: true },
            orderBy: { createdAt: 'desc' }
        }),
        db.videoCategory.findMany({
            orderBy: { displayOrder: 'asc' }
        })
    ]);

    const videosByCategory = categories.map(cat => ({
        category: cat,
        videos: videos.filter(v => v.videoCategory?.id === cat.id),
    }));

    const uncategorized = videos.filter(v => !v.videoCategory);

    if (videos.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <PlayCircle className="w-10 h-10 text-zinc-400" />
                </div>
                <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300 mb-2">
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
            {/* Page header */}
            <div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    Eğitim Videoları
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Videoya tıkladığınızda YouTube&apos;da açılır &nbsp;·&nbsp; {videos.length} video
                </p>
            </div>

            {/* Categorized */}
            {videosByCategory.map(({ category, videos: catVideos }) => {
                if (catVideos.length === 0) return null;

                return (
                    <div
                        key={category.id}
                        className="bg-white dark:bg-zinc-900 rounded-2xl border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                        {/* Category header - Note: Removed interactive expand/collapse for pure Server Component, 
                            or we could keep it with a small client component wrapper if needed. 
                            For now, let's keep it simple and always expanded or use a detail/summary. */}
                        <div className="w-full px-6 py-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md">
                                    <PlayCircle className="w-6 h-6 text-white" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                        {category.name}
                                    </h2>
                                    {category.description && (
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
                                            {category.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg">
                                    {catVideos.length} video
                                </span>
                            </div>
                        </div>

                        <div className="px-6 py-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {catVideos.map(video => (
                                    <VideoCard key={video.id} video={video} />
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })}

            {/* Uncategorized */}
            {uncategorized.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Diğer Videolar</h2>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {uncategorized.map(video => (
                                <VideoCard key={video.id} video={video} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
