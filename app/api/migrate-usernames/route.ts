import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    // Basic security check to prevent abuse, require a secret key
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== "tbf2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        let results = {
            updatedReferees: 0,
            updatedOfficials: 0,
            updatedFallbacks: 0,
            failed: 0,
            errors: [] as string[]
        };

        // 1. Get all users
        // We fetch all users to ensure their username matches their email,
        // and also to catch any the user might have manually cleared (made blank).
        const users = await prisma.user.findMany({
            include: {
                referee: true,
                official: true
            }
        });

        for (const user of users) {
            // EXPLICIT PROTECTION FOR MASTER ADMIN
            if (user.username === "talat.mustafa.ozdemir50") {
                continue;
            }

            let expectedEmail = "";

            if (user.referee?.email) {
                expectedEmail = user.referee.email;
            } else if (user.official?.email) {
                expectedEmail = user.official.email;
            }

            // If username is not the expected email, and we have an email, update it
            if (expectedEmail && user.username !== expectedEmail) {
                try {
                    // Check if this email is already used as a username by someone else
                    const existingUser = await prisma.user.findUnique({
                        where: { username: expectedEmail }
                    });

                    if (existingUser) {
                        results.errors.push(`Email ${expectedEmail} is already taken by user ID ${existingUser.id}`);
                        results.failed++;
                        continue;
                    }

                    await prisma.user.update({
                        where: { id: user.id },
                        data: { username: expectedEmail }
                    });

                    if (user.referee) results.updatedReferees++;
                    if (user.official) results.updatedOfficials++;

                } catch (e: any) {
                    results.errors.push(`Failed to update user ID ${user.id}: ${e.message}`);
                    results.failed++;
                }
            } else if (!expectedEmail && (/^\d{11}$/.test(user.username) || user.username.trim() === "")) {
                // It's a TCKN or BLANK but no email is found. Replace it with a fake email or skip.
                const fakeEmail = `silinmis_tc_${user.id}@bks.local`;
                try {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { username: fakeEmail }
                    });
                    results.updatedFallbacks++;
                } catch (e: any) {
                    results.errors.push(`Failed to fallback update user ID ${user.id}: ${e.message}`);
                    results.failed++;
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: "Username migration completed successfully.",
            results
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
