"use client";

import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import { updateVideoProgress } from "@/app/actions/video";
import { Loader2, CheckCircle } from "lucide-react";

// Dynamic import to avoid SSR issues with ReactPlayer
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

interface VideoPlayerWrapperProps {
    videoId: number;
    url: string;
    initialProgress?: number;
    isWatched?: boolean;
}

export function VideoPlayerWrapper({ videoId, url, initialProgress = 0, isWatched = false }: VideoPlayerWrapperProps) {
    const [hasMounted, setHasMounted] = useState(false);
    const [progress, setProgress] = useState(initialProgress);
    const [duration, setDuration] = useState(0);
    const [watched, setWatched] = useState(isWatched);
    const playerRef = useRef<any>(null);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleProgress = (state: { playedSeconds: number }) => {
        const currentSeconds = state.playedSeconds;
        // Update local state less frequently if needed, but react-player fires every second roughly

        // Save to DB every 5 seconds or if threshold crossed
        if (Math.floor(currentSeconds) % 5 === 0 && Math.floor(currentSeconds) !== Math.floor(progress)) {
            setProgress(currentSeconds);
            updateVideoProgress(videoId, currentSeconds, duration);
        }

        // Check for watched status locally for immediate feedback
        if (!watched && duration > 0 && (currentSeconds / duration) >= 0.20) {
            setWatched(true);
        }
    };

    const handleDuration = (d: number) => {
        setDuration(d);
        // If we have initial progress, seek to it?
        // ReactPlayer `url` change might reset, but `start` prop works?
        // Actually better to just let user start from 0 if they want, or use `onReady` to seek.
    };

    const handleSearchTo = () => {
        if (playerRef.current && initialProgress > 0) {
            playerRef.current.seekTo(initialProgress);
        }
    }

    if (!hasMounted) {
        return <div className="aspect-video bg-zinc-900 flex items-center justify-center text-white"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-zinc-800">
                <ReactPlayer
                    ref={playerRef}
                    url={url}
                    width="100%"
                    height="100%"
                    controls
                    onProgress={handleProgress}
                    onDuration={handleDuration}
                    onReady={handleSearchTo}
                    config={{
                        youtube: {
                            playerVars: { showinfo: 1 }
                        }
                    }}
                />
            </div>

            <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <div>
                    <p className="text-sm text-zinc-500">İlerleme Durumu</p>
                    <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${watched ? 'bg-green-600' : 'bg-red-600'} transition-all duration-500`}
                                style={{ width: `${Math.min(100, (duration > 0 ? (progress / duration) * 100 : 0))}%` }}
                            />
                        </div>
                        <span className="text-xs font-mono">{Math.floor(progress)}s / {Math.floor(duration)}s</span>
                    </div>
                </div>

                {watched ? (
                    <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                        <span>Tamamlandı</span>
                    </div>
                ) : (
                    <div className="text-zinc-500 text-sm">
                        Tamamlandı sayılması için %20 izlenmeli via <span className="font-bold">{Math.floor(duration * 0.2)}s</span>
                    </div>
                )}
            </div>
        </div>
    );
}
