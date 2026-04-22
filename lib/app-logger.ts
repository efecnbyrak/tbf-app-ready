/**
 * Lightweight telemetry logger for structured console output.
 * Use this for non-audit operational logging (slow queries, failsafes, etc.)
 */
export const AppLogger = {
    info: (msg: string, meta: any = {}) => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`ℹ️ [INFO][${new Date().toISOString()}] ${msg}`, meta);
        }
    },
    warn: (msg: string, meta: any = {}) => {
        console.warn(`⚠️ [WARN][${new Date().toISOString()}] ${msg}`, meta);
    },
    error: (msg: string, err: any = null) => {
        console.error(`🚨 [CRITICAL][${new Date().toISOString()}] ${msg}`, err?.message || err);
    }
};
