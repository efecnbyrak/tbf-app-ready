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
        if (isAdminRoute && session.role !== "ADMIN") {
            // Referee trying to access Admin
            return NextResponse.redirect(new URL("/referee", request.nextUrl));
        }

        if (isRefereeRoute && session.role !== "REFEREE") {
            // Admin trying to access Referee?
            return NextResponse.redirect(new URL("/admin", request.nextUrl));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/referee/:path*", "/general/:path*"],
};
