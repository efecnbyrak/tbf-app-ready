export interface CacheItem<T> {
    data: T;
    timestamp: number;
}

// Ensure the cache survives hot-reloads in development via globalThis
const globalCache = global as typeof global & {
    __matchCache?: Map<string, CacheItem<any>>;
};

if (!globalCache.__matchCache) {
    globalCache.__matchCache = new Map<string, CacheItem<any>>();
}

export const matchCache = globalCache.__matchCache;

/**
 * Gets data from cache or runs the fetcher function and caches the result.
 * @param key Unique key for the cache
 * @param fetcher Async function to fetch data if not cached
 * @param ttl Time to live in milliseconds (default: 1 hour)
 */
// Max cache entries to prevent memory leaks in long-running processes
const MAX_CACHE_ENTRIES = 100;

export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60 * 60 * 1000
): Promise<T> {
    const cached = matchCache.get(key);
    const now = Date.now();

    // Return cached data if valid
    if (cached && (now - cached.timestamp < ttl)) {
        return cached.data;
    }

    const data = await fetcher();

    // Evict oldest entries if cache is too large
    if (matchCache.size >= MAX_CACHE_ENTRIES) {
        let oldestKey = '';
        let oldestTime = Infinity;
        for (const [k, v] of matchCache) {
            if (v.timestamp < oldestTime) {
                oldestTime = v.timestamp;
                oldestKey = k;
            }
        }
        if (oldestKey) matchCache.delete(oldestKey);
    }

    // Save to cache
    matchCache.set(key, {
        data,
        timestamp: now,
    });

    return data;
}
