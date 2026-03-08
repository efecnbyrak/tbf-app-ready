/**
 * YouTube utility functions for video operations
 */

/**
 * Extract YouTube video ID from various URL formats
 */
export function getYouTubeId(url: string): string | null {
    if (!url) return null;

    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]?.length === 11) {
            return match[1];
        }
    }

    return null;
}

/**
 * Get YouTube thumbnail URL from video URL
 */
export function getYouTubeThumbnail(url: string, quality: 'default' | 'hq' | 'mq' | 'sd' | 'maxres' = 'mq'): string | null {
    const videoId = getYouTubeId(url);
    if (!videoId) return null;

    const qualityMap = {
        'default': 'default',
        'hq': 'hqdefault',
        'mq': 'mqdefault',
        'sd': 'sddefault',
        'maxres': 'maxresdefault'
    };

    return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

/**
 * Convert MM:SS or HH:MM:SS format to total seconds
 */
export function timeToSeconds(time: string): number {
    const parts = time.split(':').map(p => parseInt(p, 10));

    if (parts.length === 2) {
        // MM:SS
        const [minutes, seconds] = parts;
        return minutes * 60 + seconds;
    } else if (parts.length === 3) {
        // HH:MM:SS
        const [hours, minutes, seconds] = parts;
        return hours * 3600 + minutes * 60 + seconds;
    }

    return 0;
}

/**
 * Convert seconds to MM:SS format
 */
export function secondsToTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Parse ISO 8601 duration format (e.g., PT8M18S) to seconds
 * Used for YouTube API responses
 */
export function parseISO8601Duration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);

    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetch video duration from YouTube API
 * Requires YOUTUBE_API_KEY environment variable
 */
export async function fetchYouTubeDuration(videoUrl: string): Promise<number | null> {
    const videoId = getYouTubeId(videoUrl);
    if (!videoId) return null;

    const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!apiKey) {
        console.warn('YouTube API key not configured');
        return null;
    }

    try {
        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${apiKey}`
        );

        if (!response.ok) return null;

        const data = await response.json();
        if (!data.items || data.items.length === 0) return null;

        const duration = data.items[0].contentDetails.duration;
        return parseISO8601Duration(duration);
    } catch (error) {
        console.error('Error fetching YouTube duration:', error);
        return null;
    }
}
