/**
 * Production-grade fetch utilities:
 * - Request deduplication (prevents duplicate in-flight requests)
 * - Timeout protection via AbortController
 * - Exponential backoff retry for transient failures
 */

// ===== DEDUPLICATION =====
const requestCache = new Map<string, Promise<any>>();

export async function dedupedFetch(url: string, options?: RequestInit) {
    const cacheKey = `${url}-${JSON.stringify(options || {})}`;

    if (requestCache.has(cacheKey)) {
        return requestCache.get(cacheKey);
    }

    const requestPromise = fetch(url, options)
        .then(res => res.json())
        .finally(() => {
            requestCache.delete(cacheKey);
        });

    requestCache.set(cacheKey, requestPromise);
    return requestPromise;
}

// ===== TIMEOUT =====
export async function fetchWithTimeout(
    resource: RequestInfo,
    options: RequestInit & { timeout?: number } = {}
) {
    const { timeout = 5000, ...fetchOptions } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...fetchOptions,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error: any) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error(`[TIMEOUT] İstek ${timeout}ms süresini aştı.`);
        }
        throw error;
    }
}

// ===== RETRY WITH EXPONENTIAL BACKOFF =====
export async function fetchWithRetry(
    url: string,
    options: RequestInit = {},
    retries = 3,
    backoff = 500
): Promise<Response> {
    try {
        const res = await fetch(url, options);
        if (!res.ok && res.status >= 500) throw new Error(`Server Error ${res.status}`);
        return res;
    } catch (err: any) {
        if (retries > 0) {
            console.warn(`[RETRY] Bağlantı hatası. Kalan deneme: ${retries}. Bekleme: ${backoff}ms`);
            await new Promise((resolve) => setTimeout(resolve, backoff));
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw err;
    }
}
