"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateVideoProgress(videoId: number, seconds: number, totalDuration: number) {
    const session = await getSession();
    if (!session?.userId) return { error: "Oturum açmanız gerekiyor." };

    try {
        const progressPercentage = seconds / totalDuration;
        const isWatched = progressPercentage >= 0.20; // 20% threshold

        await db.videoProgress.upsert({
            where: {
                userId_videoId: {
                    userId: session.userId,
                    videoId: videoId
                }
            },
            create: {
                userId: session.userId,
                videoId: videoId,
                lastPosition: Math.floor(seconds),
                watched: isWatched
            },
            update: {
                lastPosition: Math.floor(seconds),
                watched: isWatched ? true : undefined // Only update to true, never back to false
            }
        });

        revalidatePath("/referee/videos");
        return { success: true };
    } catch (error) {
        console.error("Video progress error:", error);
        return { error: "İlerleme kaydedilemedi." };
    }
}
