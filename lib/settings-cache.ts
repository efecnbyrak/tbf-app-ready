import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Fetches ALL system settings in a single query, cached per-request via React cache().
 * This replaces multiple individual findUnique calls with one findMany.
 */
export const getAllSettings = cache(async function getAllSettings(): Promise<Map<string, string>> {
    const settings = await db.systemSetting.findMany();
    const map = new Map<string, string>();
    for (const s of settings) {
        map.set(s.key, s.value);
    }
    return map;
});

/**
 * Get a single setting value by key. Uses the cached batch query.
 */
export async function getSetting(key: string): Promise<string | null> {
    const all = await getAllSettings();
    return all.get(key) ?? null;
}

/**
 * Get multiple settings by keys. Uses the cached batch query.
 */
export async function getSettings(...keys: string[]): Promise<Record<string, string | null>> {
    const all = await getAllSettings();
    const result: Record<string, string | null> = {};
    for (const key of keys) {
        result[key] = all.get(key) ?? null;
    }
    return result;
}
