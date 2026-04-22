/**
 * Season (sezon) utilities.
 * Basketball seasons run Sept 1 → Aug 31.
 * In April 2026, current season = 2025-2026.
 */

export function getCurrentSeason(): {
    label: string;      // "2025-2026"
    folderName: string; // "2025-2026 Sezonu"
    startDate: Date;    // Sept 1, 2025
    endDate: Date;      // Aug 31, 2026
    startYear: number;
    endYear: number;
} {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // 1-12

    const startYear = month >= 9 ? year : year - 1;
    const endYear = startYear + 1;

    return {
        label: `${startYear}-${endYear}`,
        folderName: `${startYear}-${endYear} Sezonu`,
        startDate: new Date(`${startYear}-09-01T00:00:00.000Z`),
        endDate: new Date(`${endYear}-08-31T23:59:59.999Z`),
        startYear,
        endYear,
    };
}

export function isInCurrentSeason(tarih: Date | string | null): boolean {
    if (!tarih) return false;
    const d = typeof tarih === "string" ? new Date(tarih) : tarih;
    if (isNaN(d.getTime())) return false;
    const { startDate, endDate } = getCurrentSeason();
    return d >= startDate && d <= endDate;
}
