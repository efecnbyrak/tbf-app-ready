import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BOOTSTRAP_COOKIE_NAME = "session";
const key = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "default-secret-key-change-me");

export async function encrypt(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key);
}

export async function decrypt(input: string): Promise<any> {
    const { payload } = await jwtVerify(input, key, {
        algorithms: ["HS256"],
    });
    return payload;
}

export async function createSession(userId: number, role: string) {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
    const session = await encrypt({ userId, role, expires });

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
    const cookieStore = await cookies();
    const session = cookieStore.get(BOOTSTRAP_COOKIE_NAME)?.value;
    if (!session) return null;
    try {
        return await decrypt(session);
    } catch (error) {
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
