export async function safeDbQuery<T>(queryPromise: Promise<T>, fallbackData: T): Promise<T> {
    try {
        return await queryPromise;
    } catch (error) {
        console.error("[DB_FAILSAFE_TRIGGERED]", error);
        return fallbackData; // Returns safe defaults instead of crashing layout
    }
}
