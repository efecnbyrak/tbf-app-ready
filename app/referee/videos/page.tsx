import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Video, VideoProgress } from "@prisma/client";
import { PlayCircle, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function VideosPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/login");

    // Fetch videos and user progress
    const videos = await db.video.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            progress: {
                where: { userId: session.userId }
            }
        }
    });

    if (videos.length === 0) {
        // Auto-seed for demo if empty
        const count = await db.video.count();
        if (count === 0) {
            await db.video.create({
                data: {
                    title: "Basketbol Hakemliği Temel Prensipler",
                    url: "https://www.youtube.com/watch?v=Get7rqXYrbQ", // Example video
                    description: "FIBA 2024 kuralları çerçevesinde temel hakemlik mekanikleri.",
                    category: "Mekanik",
                    duration: 600 // Mock duration
                }
            });
            redirect("/referee/videos"); // Refresh
        }
    }

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-5xl">
            <h1 className="text-3xl font-bold mb-2">Eğitim Videoları</h1>
            <p className="text-zinc-500 mb-8">Görevli olduğunuz maçlarda uygulamanız gereken prosedürler ve kurallar.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => {
                    const userProgress = video.progress[0];
                    const isWatched = userProgress?.watched || false;

                    return (
                        <Link
                            key={video.id}
                            href={`/referee/videos/${video.id}`}
                            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg hover:border-red-200 dark:hover:border-red-900 transition-all group"
                        >
                            {/* Thumbnail Placeholder */}
                            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center">
                                {/* YouTube Thumbnail Hack */}
                                <img
                                    src={`https://img.youtube.com/vi/${video.url.split('v=')[1]}/hqdefault.jpg`}
                                    alt={video.title}
                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                    <PlayCircle className="w-12 h-12 text-white fill-red-600" />
                                </div>

                                {isWatched && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                        <CheckCircle className="w-3 h-3" />
                                        İzlenildi
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h3 className="font-semibold line-clamp-2 leading-tight group-hover:text-red-700 transition-colors">
                                        {video.title}
                                    </h3>
                                </div>
                                <p className="text-xs text-zinc-500 line-clamp-2 mb-4">
                                    {video.description}
                                </p>

                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                    <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-zinc-600 dark:text-zinc-300">
                                        {video.category || "Genel"}
                                    </span>
                                    {userProgress?.lastPosition ? (
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>Kaldığın yer: {Math.floor(userProgress.lastPosition / 60)}dk</span>
                                        </div>
                                    ) : (
                                        <span>Henüz başlanmadı</span>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar at bottom */}
                            {userProgress?.lastPosition && (
                                <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800">
                                    <div
                                        className={`h-full ${isWatched ? 'bg-green-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(100, (userProgress.lastPosition / (video.duration || 600)) * 100)}%` }} // Fallback duration
                                    />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
