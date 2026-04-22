import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== "tbf2026") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const log: string[] = [];

    try {
        // STEP 1: Ensure the username column exists
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "username" TEXT`);
            log.push("✅ Step 1: username column ensured.");
        } catch (e: any) {
            log.push("⚠️ Step 1: " + e.message);
        }

        // STEP 2: Replace TCKN usernames with emails from referee table
        try {
            const r1: any = await prisma.$executeRawUnsafe(`
                UPDATE users SET "username" = r."email"
                FROM referees r
                WHERE users.id = r."userId"
                AND users."username" ~ '^[0-9]{11}$'
                AND r."email" IS NOT NULL AND r."email" != ''
            `);
            log.push(`✅ Step 2a: Replaced TCKN usernames with referee emails. (${r1} rows)`);
        } catch (e: any) {
            log.push("⚠️ Step 2a: " + e.message);
        }

        // STEP 3: Replace TCKN usernames with emails from official table
        try {
            const r2: any = await prisma.$executeRawUnsafe(`
                UPDATE users SET "username" = g."email"
                FROM general_officials g
                WHERE users.id = g."userId"
                AND users."username" ~ '^[0-9]{11}$'
                AND g."email" IS NOT NULL AND g."email" != ''
            `);
            log.push(`✅ Step 2b: Replaced TCKN usernames with official emails. (${r2} rows)`);
        } catch (e: any) {
            log.push("⚠️ Step 2b: " + e.message);
        }

        // STEP 4: Fill remaining 11-digit usernames with placeholder
        try {
            const r3: any = await prisma.$executeRawUnsafe(`
                UPDATE users SET "username" = CONCAT('kullanici_', id::text, '@bks.local')
                WHERE "username" ~ '^[0-9]{11}$'
            `);
            log.push(`✅ Step 3: Replaced remaining TCKNs with placeholders. (${r3} rows)`);
        } catch (e: any) {
            log.push("⚠️ Step 3: " + e.message);
        }

        // STEP 5: Fix empty or NULL usernames
        try {
            const r4: any = await prisma.$executeRawUnsafe(`
                UPDATE users SET "username" = COALESCE(
                    (SELECT r."email" FROM referees r WHERE r."userId" = users.id AND r."email" IS NOT NULL AND r."email" != '' LIMIT 1),
                    (SELECT g."email" FROM general_officials g WHERE g."userId" = users.id AND g."email" IS NOT NULL AND g."email" != '' LIMIT 1),
                    CONCAT('kullanici_', id::text, '@bks.local')
                )
                WHERE "username" IS NULL OR "username" = ''
            `);
            log.push(`✅ Step 4: Fixed empty/NULL usernames. (${r4} rows)`);
        } catch (e: any) {
            log.push("⚠️ Step 4: " + e.message);
        }

        // STEP 6: Ensure NOT NULL and UNIQUE
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN "username" SET NOT NULL`);
            log.push("✅ Step 5a: username set to NOT NULL.");
        } catch (e: any) {
            log.push("⚠️ Step 5a (probably already set): " + e.message);
        }
        try {
            await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON users("username")`);
            log.push("✅ Step 5b: Unique index on username ensured.");
        } catch (e: any) {
            log.push("⚠️ Step 5b: " + e.message);
        }

        // STEP 7: Create/Fix SUPER_ADMIN
        try {
            const adminUsername = "talat.mustafa.ozdemir50";
            const adminPassword = "talat!56742";
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await prisma.$executeRawUnsafe(`INSERT INTO roles (name) VALUES ('SUPER_ADMIN') ON CONFLICT (name) DO NOTHING`);

            const roleResult: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1`);
            if (roleResult.length > 0) {
                const roleId = roleResult[0].id;
                const adminResult: any[] = await prisma.$queryRawUnsafe(`SELECT id FROM users WHERE "username" = $1 LIMIT 1`, adminUsername);

                if (adminResult.length > 0) {
                    await prisma.$executeRawUnsafe(`
                        UPDATE users SET password = $1, "roleId" = $2, "isApproved" = true, "isVerified" = true, "isActive" = true
                        WHERE "username" = $3
                    `, hashedPassword, roleId, adminUsername);
                    log.push("✅ Step 6: Super Admin password UPDATED.");
                } else {
                    await prisma.$executeRawUnsafe(`
                        INSERT INTO users ("username", password, "roleId", "isApproved", "isVerified", "isActive", "createdAt", "updatedAt")
                        VALUES ($1, $2, $3, true, true, true, NOW(), NOW())
                    `, adminUsername, hashedPassword, roleId);
                    log.push("✅ Step 6: Super Admin CREATED.");
                }
            }
        } catch (e: any) {
            log.push("⚠️ Step 6: " + e.message);
        }

        // STEP 8: Show current state of users table
        try {
            const users: any[] = await prisma.$queryRawUnsafe(`
                SELECT u.id, u."username", u."isApproved", u."isActive", r.name as role
                FROM users u LEFT JOIN roles r ON u."roleId" = r.id
                ORDER BY u.id
            `);
            log.push(`📊 Current ${users.length} users in database:`);
            for (const u of users) {
                log.push(`   ID:${u.id} | username: ${u.username} | role: ${u.role} | approved: ${u.isApproved} | active: ${u.isActive}`);
            }
        } catch (e: any) {
            log.push("⚠️ User list error: " + e.message);
        }

        return NextResponse.json({ success: true, message: "Database repair completed!", log });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message, log }, { status: 500 });
    }
}
