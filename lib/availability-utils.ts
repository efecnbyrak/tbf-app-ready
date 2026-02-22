import { getDay } from "date-fns";
import { db } from "@/lib/db";

// Helper to get window
export async function getAvailabilityWindow() {
    const today = new Date();

    // --- Target Week's Saturday ---
    // Stored in AVAILABILITY_TARGET_DATE. If not set, defaults to next Saturday.

    const currentDay = getDay(today); // 0=Sun, 6=Sat
    const daysUntilSat = currentDay === 6 ? 7 : (6 - currentDay);
    const defaultTargetSat = new Date(today);
    defaultTargetSat.setDate(today.getDate() + daysUntilSat);
    defaultTargetSat.setHours(0, 0, 0, 0);

    let targetWeekStart = new Date(defaultTargetSat);

    try {
        const s = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_TARGET_DATE" } });
        if (s && s.value) {
            targetWeekStart = new Date(s.value);
            targetWeekStart.setHours(0, 0, 0, 0);
        }
    } catch (e) {
        // Fallback to auto
    }

    // --- Window Rules ---
    // Target = Cumartesi (maç haftasının başlangıcı)
    // Form AÇILIR: target - 7 gün (önceki Cumartesi) saat 15:30
    // Form KAPANIR: target - 5 gün (Pazartesi) saat 18:30
    //
    // Örnek: target = 28.02.2026 Cumartesi
    // Açılış: 21.02.2026 Cumartesi 15:30  ← NOT: kullanıcı 22.02 dedi, bunu manual OPEN ile yönet
    // Kapanış: 23.02.2026 Pazartesi 18:30  ← kullanıcı 24.02 dedi
    //
    // Kullanıcının belirttiği: açılış 22.02.2026 15:30, kapanış 24.02.2026 18:30
    // Bu demek ki: target - 6 gün @ 15:30 ve target - 4 gün @ 18:30

    const openTime = new Date(targetWeekStart);
    openTime.setDate(targetWeekStart.getDate() - 6); // Önceki Pazar → Cumartesi (6 gün önce)
    openTime.setHours(15, 30, 0, 0);

    const deadline = new Date(targetWeekStart);
    deadline.setDate(targetWeekStart.getDate() - 4); // Salı → Pazartesi (4 gün önce)
    deadline.setHours(18, 30, 0, 0);

    const targetWeekEnd = new Date(targetWeekStart);
    targetWeekEnd.setDate(targetWeekStart.getDate() + 6); // Cuma
    targetWeekEnd.setHours(23, 59, 59, 999);

    // --- Lock Mode ---
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
        startDate: targetWeekStart, // weekStartDate (form ID)
        endDate: targetWeekEnd,
        deadline,
        openTime,
        isLocked,
        mode: setting
    };
}
