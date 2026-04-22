import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Lightweight IP tracking per-instance for rate limiting.
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Rate-limited paths with their specific limits
const RATE_LIMITED_PATHS: Record<string, { limit: number; windowMs: number; message: string }> = {
    '/api/auth/login': { limit: 5, windowMs: 60_000, message: 'Çok fazla giriş denemesi. Lütfen 1 dakika bekleyin.' },
    '/api/auth/register': { limit: 3, windowMs: 120_000, message: 'Çok fazla kayıt denemesi. Lütfen 2 dakika bekleyin.' },
};

// Prevent memory leak: clean old entries periodically
let lastCleanup = Date.now();
const CLEANUP_INTERVAL = 5 * 60_000; // 5 minutes

function cleanupRateLimitMap() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;
    for (const [key, val] of rateLimitMap) {
        if (now - val.lastReset > 10 * 60_000) {
            rateLimitMap.delete(key);
        }
    }
}

export function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Rate limiting for sensitive endpoints
    const rateLimitConfig = RATE_LIMITED_PATHS[pathname];
    if (rateLimitConfig) {
        cleanupRateLimitMap();
        const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
        const key = `${pathname}:${ip}`;
        const current = rateLimitMap.get(key) || { count: 0, lastReset: Date.now() };

        if (Date.now() - current.lastReset > rateLimitConfig.windowMs) {
            current.count = 0;
            current.lastReset = Date.now();
        }

        if (current.count >= rateLimitConfig.limit) {
            return NextResponse.json(
                { error: rateLimitConfig.message },
                { status: 429 }
            );
        }

        current.count += 1;
        rateLimitMap.set(key, current);
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

    // Content Security Policy
    response.headers.set(
        "Content-Security-Policy",
        [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob: https://img.youtube.com https://*.public.blob.vercel-storage.com",
            "font-src 'self' data:",
            "connect-src 'self' https://*.vercel-storage.com https://*.supabase.co",
            "frame-src 'self' https://www.youtube.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join("; ")
    );

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
