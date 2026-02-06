import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { VideoPlayerWrapper } from "@/components/videos/VideoPlayerWrapper";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface VideoDetailPageProps {
    params: {
        id: string;
    }
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
    const session = await getSession();
    if (!session?.userId) redirect("/login");

    const videoId = parseInt(params.id);
    if (isNaN(videoId)) notFound();

    const video = await db.video.findUnique({
        where: { id: videoId },
        include: {
            progress: {
                where: { userId: session.userId }
            }
        }
    });

    if (!video) notFound();

    const userProgress = video.progress[0];

    return (
        <div className="container mx-auto p-4 md:p-8 max-w-4xl">
            <div className="mb-6">
                <Link href="/referee/videos" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Listeye Dön
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold">{video.title}</h1>
                <div className="flex items-center gap-2 mt-2">
                    <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-0.5 rounded text-xs font-semibold">
                        {video.category || "Eğitim"}
                    </span>
                    <span className="text-zinc-400 text-xs">·</span>
                    <span className="text-zinc-500 text-sm">
                        {Math.floor(video.duration / 60)} dakika
                    </span>
                </div>
            </div>

            <VideoPlayerWrapper
                videoId={video.id}
                url={video.url}
                initialProgress={userProgress?.lastPosition || 0}
                isWatched={userProgress?.watched || false}
            />

            <div className="mt-8 bg-zinc-50 dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h2 className="font-semibold mb-2">Video Hakkında</h2>
                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {video.description || "Bu video için açıklama bulunmamaktadır."}
                </p>
            </div>
        </div>
    );
}
