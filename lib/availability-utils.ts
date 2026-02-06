import { startOfWeek, endOfWeek, addDays, getDay, isAfter, setHours, setMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { db } from "@/lib/db";

// Helper to get window
export async function getAvailabilityWindow() {
    const today = new Date();

    // Determine the "Anchor" week.
    // If we are in week X, we are filling for week X+1.
    // Week starts Saturday.
    // If today is Sunday (Feb 1), previous Sat is Jan 31. This is Current Week.
    // We are filling for Next Week: Starts Feb 7.

    // 1. Get Current Cycle Start (Most recent Saturday)
    const currentDay = getDay(today); // 0=Sun, 6=Sat
    // If today is Sat (6), daysSince=0. If Sun(0), daysSince=1.
    const daysSinceSaturday = (currentDay + 1) % 7;

    const currentCycleStart = new Date(today);
    currentCycleStart.setDate(today.getDate() - daysSinceSaturday);
    currentCycleStart.setHours(0, 0, 0, 0);

    // 2. Check for manual override in settings
    let targetWeekStart = new Date(currentCycleStart);
    targetWeekStart.setDate(currentCycleStart.getDate() + 7); // Default: Target is Next Saturday

    try {
        const s = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_TARGET_DATE" } });
        if (s && s.value) {
            targetWeekStart = new Date(s.value);
        }
    } catch (e) {
        // Fallback to auto
    }

    // 3. Calculate Window based on Target Week
    // Target is Saturday (e.g., Feb 7).
    // Window Opens: Sunday prior (Feb 1) = Target - 6 days @ 15:00
    // Window Closes: Tuesday prior (Feb 3) = Target - 4 days @ 22:00

    const openTime = new Date(targetWeekStart);
    openTime.setDate(targetWeekStart.getDate() - 6);
    openTime.setHours(15, 0, 0, 0);

    const deadline = new Date(targetWeekStart);
    deadline.setDate(targetWeekStart.getDate() - 4);
    deadline.setHours(22, 0, 0, 0);

    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 6); // Friday
    targetWeekEnd.setHours(23, 59, 59, 999);

    // 4. Check Lock Mode
    let setting = "AUTO";
    try {
        const s = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_MODE" } });
        if (s) setting = s.value;
    } catch {
        // Fallback
    }

    let isLocked = today < openTime || today > deadline;

    if (setting === "OPEN") isLocked = false;
    if (setting === "CLOSED") isLocked = true;

    return {
        startDate: targetWeekStart, // This is the ID for the form
        endDate: targetWeekEnd,
        deadline,
        openTime,
        isLocked,
        mode: setting
    };
}
