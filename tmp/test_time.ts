function getTRTDate() {
    const now = new Date();
    return new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
}

const today = getTRTDate();
console.log('Current Date (Local/System):', new Date().toString());
console.log('Current Date (Turkey):', today.toLocaleString('tr-TR'));

const currentTarget = new Date("2026-03-07T00:00:00.000Z"); // Saturday
const currentDeadline = new Date(currentTarget);
currentDeadline.setDate(currentTarget.getDate() - 4); // Tuesday
currentDeadline.setHours(20, 30, 0, 0);

console.log('Current Deadline (Raw):', currentDeadline.toString());
console.log('Today > Deadline?', today > currentDeadline);

// Simulation of what happened
if (today > currentDeadline) {
    console.log('Rollover would happen');
} else {
    console.log('Rollover would NOT happen');
}

// Adjusting for the fact that setHours(20, 30) on a Date object
// uses the system local time. If server is UTC, this is 20:30 UTC.
// 20:30 UTC is 23:30 TRT.
// If today in TRT is 22:12, today in UTC is 19:12.
// 19:12 UTC < 20:30 UTC -> No rollover.
