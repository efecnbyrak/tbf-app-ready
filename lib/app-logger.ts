/**
 * Lightweight telemetry logger for structured console output.
 * Use this for non-audit operational logging (slow queries, failsafes, etc.)
 */

const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'warn' : 'info');
const LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[LOG_LEVEL] ?? 1;

export const AppLogger = {
    info: (msg: string, meta: Record<string, unknown> = {}) => {
        if (currentLevel <= LOG_LEVELS.info) {
            console.log(`[INFO][${new Date().toISOString()}] ${msg}`, meta);
        }
    },
    warn: (msg: string, meta: Record<string, unknown> = {}) => {
        if (currentLevel <= LOG_LEVELS.warn) {
            console.warn(`[WARN][${new Date().toISOString()}] ${msg}`, meta);
        }
    },
    error: (msg: string, err: unknown = null) => {
        const errorMsg = err instanceof Error ? err.message : String(err || '');
        console.error(`[ERROR][${new Date().toISOString()}] ${msg}`, errorMsg);
    }
};
