"use client";

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { updateVideoProgress } from "@/app/actions/video";
import { Loader2, CheckCircle } from "lucide-react";

// Use main react-player (react-player/youtube subpath not supported by Turbopack)
const ReactPlayer = dynamic(() => import("react-player"), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center w-full h-full bg-black">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
    )
}) as any;

interface VideoPlayerWrapperProps {
    videoId: number;
    url: string;
    initialProgress?: number;
    isWatched?: boolean;
}

// Extract YouTube video ID from various URL formats
function getYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    return null;
}

export function VideoPlayerWrapper({
    videoId,
    url,
    initialProgress = 0,
    isWatched = false
}: VideoPlayerWrapperProps) {
    const playerRef = useRef<any>(null);
    const [progress, setProgress] = useState(initialProgress);
    const [duration, setDuration] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Extract YouTube ID and create proper URL
    const videoIdStr = getYouTubeId(url);

    if (!videoIdStr) {
        return (
            <div className="aspect-video bg-black rounded-xl flex items-center justify-center text-white">
                <p>Geçersiz video URL'si. Lütfen geçerli bir YouTube linki kullanın.</p>
            </div>
        );
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoIdStr}`;

    const handlePlay = () => {
        setHasStarted(true);
    };

    const handleProgress = (state: any) => {
        const currentProgress = state.playedSeconds;
        setProgress(currentProgress);

        // Auto-save progress every 5 seconds
        if (hasStarted && Math.floor(currentProgress) % 5 === 0) {
            updateVideoProgress(videoId, currentProgress, 0);
        }
    };

    const handleDuration = (dur: number) => {
        setDuration(dur);
    };

    const handleReady = () => {
        console.log("Player ready, video ID:", videoIdStr);
        setError(null);

        // Seek to saved position if exists
        if (initialProgress > 0 && playerRef.current) {
            setTimeout(() => {
                playerRef.current.seekTo(initialProgress, 'seconds');
            }, 500);
        }
    };

    const handleError = (e: any) => {
        console.error("Video error:", e);
        setError("Video yüklenirken hata oluştu");
    };

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Video Player */}
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                {error ? (
                    <div className="flex flex-col items-center justify-center w-full h-full text-white gap-4">
                        <p className="text-red-500">{error}</p>
                        <a
                            href={youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
                        >
                            YouTube'da Aç
                        </a>
                    </div>
                ) : (
                    <ReactPlayer
                        ref={playerRef}
                        url={youtubeUrl}
                        width="100%"
                        height="100%"
                        controls={true}
                        playing={true}
                        playsinline={true}
                        onPlay={handlePlay}
                        onProgress={handleProgress}
                        onDuration={handleDuration}
                        onReady={handleReady}
                        onError={handleError}
                        config={{
                            youtube: {
                                playerVars: {
                                    autoplay: 1,
                                    rel: 0,
                                    modestbranding: 1,
                                    playsinline: 1,
                                    enablejsapi: 1,
                                    origin: typeof window !== 'undefined' ? window.location.origin : ''
                                }
                            }
                        } as any}
                    />
                )}
            </div>

            {/* Progress Bar */}
            {hasStarted && duration > 0 && (
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-zinc-500 dark:text-zinc-400">
                        <span>{Math.floor(progress / 60)}:{Math.floor(progress % 60).toString().padStart(2, '0')}</span>
                        <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-red-600 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    {progressPercent > 90 && (
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                            <CheckCircle className="w-4 h-4" />
                            <span>Video tamamlandı!</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
