import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight IP tracking per-instance.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

export function middleware(request: NextRequest) {
    if (request.nextUrl.pathname.startsWith('/api/auth/login')) {
        const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
        const limit = 5; // 5 attempts
        const windowMs = 60 * 1000; // per 1 minute

        const current = rateLimitMap.get(ip) || { count: 0, lastReset: Date.now() };

        if (Date.now() - current.lastReset > windowMs) {
            current.count = 0;
            current.lastReset = Date.now();
        }

        if (current.count >= limit) {
            return NextResponse.json(
                { error: 'Çok fazla giriş denemesi. Lütfen 1 dakika bekleyin.' },
                { status: 429 }
            );
        }

        current.count += 1;
        rateLimitMap.set(ip, current);
    }

    const response = NextResponse.next();

    // ==========================================
    // SECURITY HEADERS
    // ==========================================

    // Prevent clickjacking
    response.headers.set("X-Frame-Options", "DENY");

    // Prevent MIME-type sniffing
    response.headers.set("X-Content-Type-Options", "nosniff");

    // Referrer policy — send origin only for cross-origin requests
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // HSTS — force HTTPS for 1 year (only applied over HTTPS by browsers)
    response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
    );

    // Permissions Policy — disable unused browser features
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );

    // XSS Protection (legacy, but still useful for older browsers)
    response.headers.set("X-XSS-Protection", "1; mode=block");

    // Remove server identification
    response.headers.delete("X-Powered-By");
    response.headers.delete("Server");

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         * - Public assets (images etc.)
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|hakem/|logo/).*)",
    ],
};
