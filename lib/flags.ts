/**
 * Feature Flags (Kill Switches)
 * 
 * Control critical features via Vercel Environment Variables.
 * To disable a feature in production, set the env var to "false" in Vercel Dashboard.
 * No redeployment needed — Vercel reads env vars at runtime for NEXT_PUBLIC_ prefixed vars.
 */
export const FeatureFlags = {
    /** Set NEXT_PUBLIC_FLAG_REALTIME=false in Vercel to disable all realtime subscriptions */
    ENABLE_REALTIME: process.env.NEXT_PUBLIC_FLAG_REALTIME !== "false",

    /** Set NEXT_PUBLIC_FLAG_EXPORTS=false to disable Excel/PDF export routes */
    ENABLE_EXCEL_EXPORTS: process.env.NEXT_PUBLIC_FLAG_EXPORTS !== "false",

    /** Set NEXT_PUBLIC_FLAG_CHARTS=false to disable heavy chart rendering */
    ENABLE_CHARTS: process.env.NEXT_PUBLIC_FLAG_CHARTS !== "false",
};
