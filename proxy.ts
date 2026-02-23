import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(request: NextRequest) {
    // 1. Check if route is protected
    const path = request.nextUrl.pathname;
    const isAdminRoute = path.startsWith("/admin");
    const isRefereeRoute = path.startsWith("/referee");
    const isGeneralRoute = path.startsWith("/general");

    // Keep admin login public if it's under /admin
    if (path === "/admin/login") {
        return NextResponse.next();
    }

    if (isAdminRoute || isRefereeRoute || isGeneralRoute) {
        // 2. Verify Session
        const cookie = request.cookies.get("session")?.value;
        const session = cookie ? await decrypt(cookie) : null;

        if (!session?.userId) {
            // Not authenticated -> Redirect to Home (where login modal is)
            if (isAdminRoute) {
                return NextResponse.redirect(new URL("/admin/login", request.nextUrl));
            }
            return NextResponse.redirect(new URL("/", request.nextUrl));
        }

        // 3. Check Role Permissions
        const role = session.role;
        const isAdminUser = role === "ADMIN" || role === "SUPER_ADMIN" || role === "ADMIN_IHK";
        const isRefereeUser = role === "REFEREE";

        if (isAdminRoute && !isAdminUser) {
            // Non-admin trying to access Admin -> Go to referee (or home if not even referee)
            return NextResponse.redirect(new URL("/referee", request.nextUrl));
        }

        if (isRefereeRoute && !isRefereeUser && !isAdminUser) {
            // Someone who is neither a referee nor an admin trying to access referee
            return NextResponse.redirect(new URL("/admin", request.nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/referee/:path*", "/general/:path*"],
};
