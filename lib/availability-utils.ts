import { startOfWeek, endOfWeek, addDays, getDay, isAfter, setHours, setMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { db } from "@/lib/db";

// Helper to get window
export async function getAvailabilityWindow() {
    const today = new Date();

    // The cycle starts on Saturday (Day 6) and ends on Friday (Day 5 of next week)
    // We want the window for NEXT week's assignments
    // Example: Current cycle is Sat Jan 25 - Fri Jan 31
    // The window for this cycle opens Sun Jan 26 15:00 and closes Tue Jan 28 22:00

    // 0 Sun ... 6 Sat
    const currentDay = getDay(today);

    // Saturday is day 0 of our logic
    const daysSinceSaturday = (currentDay + 1) % 7;

    const startOfCycle = new Date(today);
    startOfCycle.setDate(today.getDate() - daysSinceSaturday);
    startOfCycle.setHours(0, 0, 0, 0);

    const endOfCycle = new Date(startOfCycle);
    endOfCycle.setDate(startOfCycle.getDate() + 6); // Sat + 6 = Fri
    endOfCycle.setHours(23, 59, 59, 999);

    // Window Open: Sunday 15:00 of this cycle
    const openTime = new Date(startOfCycle);
    openTime.setDate(startOfCycle.getDate() + 1); // Sunday
    openTime.setHours(15, 0, 0, 0);

    // Deadline: Tuesday 22:00 of this cycle.
    const deadline = new Date(startOfCycle);
    deadline.setDate(startOfCycle.getDate() + 3); // Tuesday
    deadline.setHours(22, 0, 0, 0);

    // Check Settings
    let setting = "AUTO";
    try {
        const s = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_MODE" } });
        if (s) setting = s.value;
    } catch {
        // Fallback
    }

    // Logic for AUTO: Closed before Sun 15:00 OR after Tue 22:00
    let isLocked = today < openTime || today > deadline;

    if (setting === "OPEN") isLocked = false;
    if (setting === "CLOSED") isLocked = true;

    return {
        startDate: startOfCycle,
        endDate: endOfCycle,
        deadline,
        openTime,
        isLocked,
        mode: setting
    };
}
