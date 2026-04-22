function testGetAvailabilityWindow(mockTimeStr: string, settings: any) {
    const today = new Date(mockTimeStr);
    let storedTargetDate = new Date(settings.AVAILABILITY_TARGET_DATE);

    // Logic from availability-utils.ts: Force Saturday
    const dayOfStored = storedTargetDate.getDay();
    if (dayOfStored !== 6) {
        const diff = 6 - dayOfStored;
        storedTargetDate.setDate(storedTargetDate.getDate() + diff);
    }
    storedTargetDate.setHours(0, 0, 0, 0);

    const saturday = new Date(storedTargetDate);

    // Opening: Saturday - 6 days (Sunday)
    const openTime = new Date(saturday);
    openTime.setDate(saturday.getDate() - 6);
    openTime.setHours(15, 30, 0, 0);

    // Closing: Saturday - 4 days (Tuesday)
    const deadline = new Date(saturday);
    deadline.setDate(saturday.getDate() - 4);
    deadline.setHours(20, 30, 0, 0);

    const isLocked = today < openTime || today > deadline;

    return {
        isLocked,
        openTime: openTime.toLocaleString('tr-TR'),
        deadline: deadline.toLocaleString('tr-TR'),
        today: today.toLocaleString('tr-TR'),
        saturday: saturday.toLocaleString('tr-TR')
    };
}

const settings = {
    AVAILABILITY_TARGET_DATE: "2026-03-07T00:00:00.000Z", // Sat Mar 7
    CURRENT_WEEK_NUMBER: 26
};

console.log("--- Refined Integrated Cycle Verification ---");

// Test: March 3rd (Tuesday) 22:30 TRT
// Saturday is March 7.
// Window should be March 1 (Sunday) to March 3 (Tuesday).
console.log("Test (Tue 22:30):", testGetAvailabilityWindow("2026-03-03T22:30:00+03:00", settings));

// Test: Sunday March 1 15:31 (Opening)
console.log("Test (Sun 15:31):", testGetAvailabilityWindow("2026-03-01T15:31:00+03:00", settings));
