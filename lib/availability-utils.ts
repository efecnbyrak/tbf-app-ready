import { getDay } from "date-fns";
import { cache } from "react";
import { db } from "@/lib/db";
import { getAllSettings } from "@/lib/settings-cache";

// Helper to get window
// `cache()` deduplicates calls within a single server render tree —
// multiple server components on the same page share one DB fetch.
export const getAvailabilityWindow = cache(async function getAvailabilityWindow() {
    // 0. Get current time in Turkey Time (TRT - UTC+3)
    const trtDateStr = new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
    const today = new Date(trtDateStr);

    // 1. Get settings from DB — single batched query via settings-cache
    let storedTargetDate: Date | null = null;
    let storedWeekNumber = 1;
    let setting = "AUTO";

    let isManualOverride = false;
    let lastWeekRolloverKey = "";

    try {
        const settings = await getAllSettings();

        const targetVal = settings.get("AVAILABILITY_TARGET_DATE");
        const weekVal = settings.get("CURRENT_WEEK_NUMBER");
        const modeVal = settings.get("AVAILABILITY_MODE");
        const manualVal = settings.get("AVAILABILITY_TARGET_MANUAL");
        const rolloverVal = settings.get("LAST_WEEK_ROLLOVER_DATE");

        if (targetVal) storedTargetDate = new Date(targetVal);
        if (weekVal) storedWeekNumber = parseInt(weekVal);
        if (modeVal) setting = modeVal;
        if (manualVal === "true") isManualOverride = true;
        lastWeekRolloverKey = rolloverVal || "";
    } catch (e) {
        console.error("[AVAILABILITY] Error fetching settings:", e);
    }

    // Default to 'current' Saturday if nothing stored
    // Default to 'current' Saturday if nothing stored
    // This finds the Saturday that just passed (or today if it is Saturday)
    if (!storedTargetDate) {
        const currentDay = getDay(today);
        const offset = (currentDay - 6 + 7) % 7;
        storedTargetDate = new Date(today);
        storedTargetDate.setDate(today.getDate() - offset);
    }

    // CRITICAL: Ensure storedTargetDate is ALWAYS a Saturday
    const dayOfStored = getDay(storedTargetDate);
    if (dayOfStored !== 6) {
        const backOffset = (dayOfStored - 6 + 7) % 7;
        storedTargetDate.setDate(storedTargetDate.getDate() - backOffset);
    }
    storedTargetDate.setHours(0, 0, 0, 0);

    // --- AUTOMATIC ROLLOVER LOGIC ---
    let currentTarget = new Date(storedTargetDate);
    let currentWeek = storedWeekNumber;
    let didRolloverTarget = false;
    let didRolloverWeek = false;

    // 1. Rollover for Target Date (on the Saturday itself)
    // Skipped when admin has manually set the target date via settings panel.
    if (!isManualOverride) {
        while (true) {
            // Advance only when the target Saturday itself has arrived
            const rolloverThreshold = new Date(currentTarget);
            rolloverThreshold.setHours(0, 0, 0, 0);

            if (today >= rolloverThreshold) {
                currentTarget.setDate(currentTarget.getDate() + 7);
                didRolloverTarget = true;
            } else {
                break;
            }
        }
    }

    // 2. Rollover for Week Number (Monday 00:00)
    // Use YYYY-MM-DD to avoid ISO timezone shifts causing double-increments

    // Current Monday in YYYY-MM-DD according to TRT
    const day = today.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    const mondayKey = monday.toISOString().split('T')[0];

    if (lastWeekRolloverKey !== mondayKey) {
        currentWeek += 1;
        didRolloverWeek = true;
    }

    if (didRolloverTarget || didRolloverWeek) {
        try {
            const updates = [];
            if (didRolloverTarget) {
                updates.push(db.systemSetting.upsert({
                    where: { key: "AVAILABILITY_TARGET_DATE" },
                    create: { key: "AVAILABILITY_TARGET_DATE", value: currentTarget.toISOString() },
                    update: { value: currentTarget.toISOString() }
                }));
            }
            if (didRolloverWeek) {
                updates.push(db.systemSetting.upsert({
                    where: { key: "CURRENT_WEEK_NUMBER" },
                    create: { key: "CURRENT_WEEK_NUMBER", value: String(currentWeek) },
                    update: { value: String(currentWeek) }
                }));
                updates.push(db.systemSetting.upsert({
                    where: { key: "LAST_WEEK_ROLLOVER_DATE" },
                    create: { key: "LAST_WEEK_ROLLOVER_DATE", value: mondayKey },
                    update: { value: mondayKey }
                }));
            }
            await db.$transaction(updates);
        } catch (e) {
            console.error("[AVAILABILITY] Rollover failed:", e);
        }
    }

    // 2. Window Calculations (Strictly Anchored to Saturday)
    // currentTarget is the Saturday of the OPERATIONAL week.
    const startDate = new Date(currentTarget);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(currentTarget);
    endDate.setDate(currentTarget.getDate() + 6); // Friday
    endDate.setHours(23, 59, 59, 999);

    // Opening: Sunday BEFORE the operational week (currentTarget - 6 days)
    const openTime = new Date(currentTarget);
    openTime.setDate(currentTarget.getDate() - 6);
    openTime.setHours(15, 0, 0, 0);

    // Closing: Tuesday OF the current submission week (currentTarget - 4 days)
    const deadline = new Date(currentTarget);
    deadline.setDate(currentTarget.getDate() - 4);
    deadline.setHours(20, 30, 0, 0); // User's specific example was 20:30

    // 3. Lock Status
    let isLocked = today < openTime || today > deadline;
    if (setting === "OPEN") isLocked = false;
    else if (setting === "CLOSED") isLocked = true;

    return {
        startDate,
        endDate,
        deadline,
        openTime,
        isLocked,
        mode: setting,
        weekNumber: currentWeek
    };
});
