import { getDay } from "date-fns";

function testGetAvailabilityWindow(mockTimeStr: string, settings: any) {
    const today = new Date(mockTimeStr);
    let storedTargetDate = new Date(settings.AVAILABILITY_TARGET_DATE);
    let currentWeek = settings.CURRENT_WEEK_NUMBER;

    storedTargetDate.setHours(0, 0, 0, 0);

    let currentTarget = new Date(storedTargetDate);

    while (true) {
        // ROLLOVERS ONLY AT SUNDAY 15:30
        const nextCycleOpen = new Date(currentTarget);
        nextCycleOpen.setDate(currentTarget.getDate() + 1); // Sunday after Saturday
        nextCycleOpen.setHours(15, 30, 0, 0);

        if (today > nextCycleOpen) {
            currentTarget.setDate(currentTarget.getDate() + 7);
            currentWeek += 1;
        } else {
            break;
        }
    }

    const openTime = new Date(currentTarget);
    openTime.setDate(currentTarget.getDate() - 6);
    openTime.setHours(15, 30, 0, 0);

    const deadline = new Date(currentTarget);
    deadline.setDate(currentTarget.getDate() - 4);
    deadline.setHours(20, 30, 0, 0);

    const isLocked = today < openTime || today > deadline;

    return {
        week: currentWeek,
        isLocked,
        openTime: openTime.toLocaleString('tr-TR'),
        deadline: deadline.toLocaleString('tr-TR'),
        today: today.toLocaleString('tr-TR')
    };
}

const settings = {
    AVAILABILITY_TARGET_DATE: "2026-03-07T00:00:00.000Z", // Week 26 (Sat Mar 7)
    CURRENT_WEEK_NUMBER: 26,
    AVAILABILITY_MODE: "AUTO"
};

console.log("--- Integrated Cycle Verification ---");

// Test Case 1: Tuesday 22:30 (Current Time - Should stay Week 26, but Locked)
console.log("Test 1 (Tue 22:30):", testGetAvailabilityWindow("2026-03-03T22:30:00+03:00", settings));

// Test Case 2: Friday (Should still be Week 26, Locked)
console.log("Test 2 (Fri):", testGetAvailabilityWindow("2026-03-06T12:00:00+03:00", settings));

// Test Case 3: Sunday 15:29 (Should still be Week 26, Locked)
console.log("Test 3 (Sun 15:29):", testGetAvailabilityWindow("2026-03-08T15:29:00+03:00", settings));

// Test Case 4: Sunday 15:31 (ROLLOVER TO WEEK 27, Open)
console.log("Test 4 (Sun 15:31):", testGetAvailabilityWindow("2026-03-08T15:31:00+03:00", settings));
