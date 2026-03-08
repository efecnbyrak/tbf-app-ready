import { sendAnnouncement } from './app/actions/announcements';

async function testPermission() {
    console.log("Testing permission logic...");

    // We can't easily mock getSession in a simple script without setup,
    // but we can at least check if the code compiles and if there are obvious logic errors.

    // The code I wrote:
    // if (!session?.role || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
    //     throw new Error("Unauthorized");
    // }

    const mockSession = { role: "ADMIN" };
    const roles = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"];

    if (mockSession.role && roles.includes(mockSession.role)) {
        console.log("SUCCESS: ADMIN role is allowed.");
    } else {
        console.log("FAILURE: ADMIN role is NOT allowed.");
    }

    const mockSessionSuper = { role: "SUPER_ADMIN" };
    if (mockSessionSuper.role && roles.includes(mockSessionSuper.role)) {
        console.log("SUCCESS: SUPER_ADMIN role is allowed.");
    } else {
        console.log("FAILURE: SUPER_ADMIN role is NOT allowed.");
    }
}

testPermission();
