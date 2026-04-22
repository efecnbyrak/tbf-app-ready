import { db } from './db';
import { MatchData } from './match-parser';

interface UserStorage {
    matches: MatchData[];
    hasNew: boolean;
    lastSync: string;
    scannedSeasons?: string[];
}

interface GlobalStorage {
    allMatches: MatchData[];
    lastSync: string;
    isSyncing: boolean;
    filesScanned?: string[];
    uniqueNamesCount?: number;
    nameSample?: string[];
}

/**
 * Loads user match data from database persistence
 */
export async function getUserMatchesStore(userId: number): Promise<UserStorage | null> {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { matchStore: true }
        });

        if (!user?.matchStore) {
            return null;
        }

        // Prisma handles JSON parsing automatically for PostgreSQL Json fields
        return user.matchStore as unknown as UserStorage;
    } catch (e) {
        console.error(`[STORAGE] DB Error reading matches for user ${userId}:`, e);
        return null;
    }
}

/**
 * Saves user match data to database persistence
 */
export async function saveUserMatchesStore(userId: number, matches: MatchData[], hasNew: boolean, scannedSeasons?: string[]) {
    // If scannedSeasons not provided, try to preserve existing ones
    let finalSeasons = scannedSeasons;
    if (!finalSeasons) {
        const existing = await getUserMatchesStore(userId);
        finalSeasons = existing?.scannedSeasons || [];
    }

    const storage: UserStorage = {
        matches,
        hasNew,
        lastSync: new Date().toISOString(),
        scannedSeasons: Array.from(new Set(finalSeasons)) // Deduplicate
    };

    try {
        await db.user.update({
            where: { id: userId },
            data: {
                matchStore: storage as any
            }
        });
        return true;
    } catch (e) {
        console.error(`[STORAGE] DB Error saving matches for user ${userId}:`, e);
        return false;
    }
}

/**
 * Clears the "new matches" notification flag — single direct update, no read needed
 */
export async function clearMatchNotification(userId: number) {
    try {
        const user = await db.user.findUnique({
            where: { id: userId },
            select: { matchStore: true }
        });
        if (!user?.matchStore) return;

        const storage = user.matchStore as unknown as UserStorage;
        if (!storage.hasNew) return;

        storage.hasNew = false;
        await db.user.update({
            where: { id: userId },
            data: { matchStore: storage as any }
        });
    } catch (e) {
        console.error(`[STORAGE] clearMatchNotification error for user ${userId}:`, e);
    }
}

/**
 * Checks if a user has new unviewed matches
 */
export async function hasNewMatches(userId: number): Promise<boolean> {
    const storage = await getUserMatchesStore(userId);
    return storage?.hasNew || false;
}

/**
 * Global Match Registry - Stores all found matches across all files
 */
export async function getGlobalMatchesStore(): Promise<GlobalStorage | null> {
    try {
        const setting = await db.systemSetting.findUnique({
            where: { key: 'GLOBAL_MATCH_REGISTRY' }
        });
        if (!setting?.value) return null;
        return JSON.parse(setting.value);
    } catch (e) {
        return null;
    }
}

export async function saveGlobalMatchesStore(matches: MatchData[], isSyncing: boolean = false) {
    const uniqueNames = [...new Set(matches.flatMap(m => [
        ...m.hakemler, ...m.masa_gorevlileri, ...m.saglikcilar, ...m.istatistikciler, ...m.gozlemciler
    ]))].sort();

    const storage: GlobalStorage = {
        allMatches: matches,
        lastSync: new Date().toISOString(),
        isSyncing,
        filesScanned: [...new Set(matches.map(m => m.kaynak_dosya.split(" → ")[0]))],
        uniqueNamesCount: uniqueNames.length,
        nameSample: uniqueNames.slice(0, 100)
    };
    try {
        await db.systemSetting.upsert({
            where: { key: 'GLOBAL_MATCH_REGISTRY' },
            update: { value: JSON.stringify(storage) },
            create: { key: 'GLOBAL_MATCH_REGISTRY', value: JSON.stringify(storage) }
        });
        return true;
    } catch (e) {
        console.error("[STORAGE] Global DB Error:", e);
        return false;
    }
}

export async function getSyncStatus() {
    const store = await getGlobalMatchesStore();
    return {
        isSyncing: store?.isSyncing || false,
        lastSync: store?.lastSync || null
    };
}
