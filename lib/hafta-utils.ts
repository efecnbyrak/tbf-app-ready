// Reference: Week 31 starts Monday April 6, 2026
const REFERENCE_WEEK = 31;
const REFERENCE_MONDAY = new Date("2026-04-06T00:00:00.000Z");

export function getWeekDateRange(weekNumber: number): { start: Date; end: Date; label: string } {
    const diffWeeks = weekNumber - REFERENCE_WEEK;
    const start = new Date(REFERENCE_MONDAY);
    start.setUTCDate(start.getUTCDate() + diffWeeks * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    const label = `${formatTR(start)} - ${formatTR(end)}`;
    return { start, end, label };
}

export function getWeekNumberForDate(date: Date): number {
    const d = new Date(date);
    // Get Monday of this date's week
    const day = d.getUTCDay(); // 0=Sun,1=Mon...
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setUTCDate(d.getUTCDate() + diffToMonday);
    d.setUTCHours(0, 0, 0, 0);
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const diff = d.getTime() - REFERENCE_MONDAY.getTime();
    return REFERENCE_WEEK + Math.round(diff / msPerWeek);
}

function formatTR(d: Date): string {
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = d.getUTCFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

// Current week based on today
export function getCurrentWeekNumber(): number {
    return getWeekNumberForDate(new Date());
}
