import { startOfWeek, endOfWeek, addDays, getDay, isAfter, setHours, setMinutes } from "date-fns";
import { tr } from "date-fns/locale";
import { db } from "@/lib/db";

// Helper to get window
export async function getAvailabilityWindow() {
    const today = new Date();

    // Find previous Saturday (or today if Sat)
    // 0 Sun ... 6 Sat
    const currentDay = getDay(today);

    // Sat=6 -> 0
    // Sun=0 -> 1
    // Mon=1 -> 2
    const daysToSubtract = (currentDay + 1) % 7;

    const startOfCycle = new Date(today);
    startOfCycle.setDate(today.getDate() - daysToSubtract);
    startOfCycle.setHours(0, 0, 0, 0);

    const endOfCycle = new Date(startOfCycle);
    endOfCycle.setDate(startOfCycle.getDate() + 6); // Sat + 6 = Fri
    endOfCycle.setHours(23, 59, 59, 999);

    // Deadline: Tuesday of this cycle.
    const deadline = new Date(startOfCycle);
    deadline.setDate(startOfCycle.getDate() + 3);
    deadline.setHours(23, 59, 59, 999); // End of Tuesday

    // Check Settings
    let setting = "AUTO";
    try {
        const s = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_MODE" } });
        if (s) setting = s.value;
    } catch {
        // Fallback
    }

    let isLocked = isAfter(today, deadline);

    if (setting === "OPEN") isLocked = false;
    if (setting === "CLOSED") isLocked = true;

    return {
        startDate: startOfCycle,
        endDate: endOfCycle,
        deadline,
        isLocked,
        mode: setting
    };
}
