import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BOOTSTRAP_COOKIE_NAME = "session";
// 10/10 Security Recommendation: Always set NEXTAUTH_SECRET in your production environment variables.
const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "tbf-appointment-system-secure-fallback-key-2026";
const key = new TextEncoder().encode(secret);

export async function encrypt(payload: any, duration: string = "24h") {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(duration)
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function createSession(userId: number, role: string, rememberMe: boolean = false) {
    const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const durationStr = rememberMe ? "30d" : "24h";
    const expires = new Date(Date.now() + durationMs);
    const session = await encrypt({ userId, role, expires }, durationStr);

    const cookieStore = await cookies();
    cookieStore.set(BOOTSTRAP_COOKIE_NAME, session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires,
        sameSite: "lax",
        path: "/",
    });
}

export async function getSession() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get(BOOTSTRAP_COOKIE_NAME)?.value;
        if (!session) return null;
        return await decrypt(session);
    } catch (error) {
        console.error("[SESSION] getSession error:", error);
        return null;
    }
}

export async function deleteSession() {
    const cookieStore = await cookies();
    cookieStore.delete(BOOTSTRAP_COOKIE_NAME);
}

export async function verifySession() {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(BOOTSTRAP_COOKIE_NAME)?.value;

    if (!cookie) {
        redirect("/");
    }

    try {
        const session = await decrypt(cookie);

        if (!session?.userId) {
            redirect("/");
        }

        return { isAuth: true, userId: session.userId, role: session.role };
    } catch (error) {
        redirect("/");
    }
}
