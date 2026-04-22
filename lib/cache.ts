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
export async function getCachedData<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 60 * 60 * 1000
): Promise<T> {
    const cached = matchCache.get(key);
    const now = Date.now();

    // Return cached data if valid
    if (cached && (now - cached.timestamp < ttl)) {
        console.log(`[CACHE HIT] Returning instantly for ${key}`);
        return cached.data;
    }

    console.log(`[CACHE MISS] Fetching fresh data for ${key}`);
    const data = await fetcher();

    // Save to cache
    matchCache.set(key, {
        data,
        timestamp: now,
    });

    return data;
}
