import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BOOTSTRAP_COOKIE_NAME = "session";
// 10/10 Security Recommendation: Always set NEXTAUTH_SECRET in your production environment variables.
const getSessionKey = () => {
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;

    if (!secret) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("CRITICAL: NEXTAUTH_SECRET or JWT_SECRET must be set in production.");
        }
        // Dev-only fallback — never used in production
        return new TextEncoder().encode("dev-only-fallback-key-not-for-production-use!!");
    }

    return new TextEncoder().encode(secret);
};


export async function encrypt(payload: any, duration: string = "24h") {
    // 10/10 Reliability: Ensure all payload data is serializable (strings/numbers/booleans)
    // Date objects in payload can cause hydration mismatch or server-side exceptions in some environments.
    const sanitizedPayload = JSON.parse(JSON.stringify(payload));

    return await new SignJWT(sanitizedPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(duration)
        .sign(getSessionKey());
}

export async function decrypt(input: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(input, getSessionKey(), {
            algorithms: ["HS256"],
        });
        return payload;
    } catch (err) {
        if (process.env.NODE_ENV !== "production") {
            console.warn("[SESSION] JWT Decryption failed:", (err as any).message);
        }
        return null;
    }
}

export async function createSession(userId: number, role: string, rememberMe: boolean = false) {
    // rememberMe = true → 365 days (effectively permanent until manual logout)
    // rememberMe = false → 24 hours only
    const durationMs = rememberMe ? 365 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const durationStr = rememberMe ? "365d" : "24h";
    const expires = new Date(Date.now() + durationMs);

    // Use ISO string for expires to avoid serialization issues
    const session = await encrypt({
        userId,
        role,
        expires: expires.toISOString()
    }, durationStr);

    const cookieStore = await cookies();
    cookieStore.set(BOOTSTRAP_COOKIE_NAME, session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        expires,
        sameSite: "strict",
        path: "/",
    });
}

export async function getSession() {
    try {
        // cookies() is a dynamic function and must be handled carefully
        const cookieStore = await cookies();
        const cookie = cookieStore.get(BOOTSTRAP_COOKIE_NAME);

        if (!cookie?.value) return null;

        const decrypted = await decrypt(cookie.value);
        if (!decrypted) return null;

        // 10/10 Reliability: Ensure return object is flat and serializable
        return {
            userId: decrypted.userId,
            role: decrypted.role,
            expires: decrypted.expires
        };
    } catch (error) {
        // Silent catch for production stability
        if (process.env.NODE_ENV !== "production") {
            console.error("[SESSION] getSession fail:", error);
        }
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
