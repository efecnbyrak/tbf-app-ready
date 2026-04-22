import { db } from "./db";
import { randomBytes } from "crypto";

// Cache to prevent redundant schema checks in the same execution context
let isSchemaChecked = false;

/**
 * Self-healing helper to add missing columns if they don't exist.
 * This handles differences between Postgres (Production) and SQLite (Local Dev).
 */
export async function ensureSchemaColumns() {
    if (isSchemaChecked) return;

    try {
        console.log("[DB-HEAL] Checking database schema...");

        // Helper to execute SQL with logging
        const runQuery = async (sql: string) => {
            try {
                await db.$executeRawUnsafe(sql);
                return true;
            } catch (err: any) {
                const msg = err.message || "";
                // Ignore "already exists" errors
                if (!msg.includes("already exists") && !msg.includes("duplicate column")) {
                    console.warn(`[DB-HEAL] Query failed: ${sql.substring(0, 50)}... Error: ${msg}`);
                    return false;
                }
                return true; // Already exists is a success for our purpose
            }
        };

        // 1. Critical column: matchStore
        // Try Postgres JSONB, then fallback to TEXT (SQLite)
        const success = await runQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "matchStore" JSONB`);
        if (!success) {
            await runQuery(`ALTER TABLE users ADD COLUMN IF NOT EXISTS "matchStore" TEXT`);
        }

        // 2. Other missing User columns
        const userCols = [
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "isVerified" BOOLEAN NOT NULL DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "forceRefresh" BOOLEAN NOT NULL DEFAULT false`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationCode" TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "verificationCodeExpiresAt" TIMESTAMP`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetPasswordCode" TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "resetPasswordExpiresAt" TIMESTAMP`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "recoveryCode" TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "pendingEmail" TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "securityQuestion" TEXT`,
            `ALTER TABLE users ADD COLUMN IF NOT EXISTS "securityAnswer" TEXT`
        ];

        for (const sql of userCols) {
            await runQuery(sql);
        }

        // Generate missing recovery codes safely
        try {
            const usersMissingCode = await db.user.findMany({
                where: { OR: [{ recoveryCode: null }, { recoveryCode: "" }] },
                select: { id: true }
            });

            if (usersMissingCode.length > 0) {
                const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                const generateCode = () => {
                    const bytes = randomBytes(8);
                    let code = "";
                    for (let i = 0; i < 8; i++) {
                        if (i === 4) code += "-";
                        code += chars.charAt(bytes[i] % chars.length);
                    }
                    return code;
                };

                await db.$transaction(
                    usersMissingCode.map(u =>
                        db.user.update({
                            where: { id: u.id },
                            data: { recoveryCode: generateCode() }
                        })
                    )
                );
                console.log(`[DB-HEAL] Generated recovery codes for ${usersMissingCode.length} users.`);
            }
        } catch(e) {
             console.warn("[DB-HEAL] Could not generate recovery codes (table might not exist yet):", e);
        }

        // 3. Referee columns
        const refCols = [
            `ALTER TABLE referees ADD COLUMN IF NOT EXISTS "address" TEXT`,
            `ALTER TABLE referees ADD COLUMN IF NOT EXISTS "job" TEXT`,
            `ALTER TABLE referees ADD COLUMN IF NOT EXISTS "points" INTEGER DEFAULT 0`,
            `ALTER TABLE referees ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 0`,
            `ALTER TABLE referees ADD COLUMN IF NOT EXISTS "iban" TEXT`
        ];

        for (const sql of refCols) {
            await runQuery(sql);
        }

        // 4. Official columns
        const offCols = [
            `ALTER TABLE general_officials ADD COLUMN IF NOT EXISTS "address" TEXT`,
            `ALTER TABLE general_officials ADD COLUMN IF NOT EXISTS "job" TEXT`,
            `ALTER TABLE general_officials ADD COLUMN IF NOT EXISTS "points" INTEGER DEFAULT 0`,
            `ALTER TABLE general_officials ADD COLUMN IF NOT EXISTS "rating" INTEGER DEFAULT 0`,
            `ALTER TABLE general_officials ADD COLUMN IF NOT EXISTS "iban" TEXT`
        ];

        for (const sql of offCols) {
            await runQuery(sql);
        }

        // 5. New ReffAI Documents Table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "reffai_documents" (
                "id" SERIAL PRIMARY KEY,
                "fileName" TEXT NOT NULL,
                "chunkIndex" INTEGER NOT NULL,
                "content" TEXT NOT NULL,
                "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        // Add index if not exists (Postgres)
        await runQuery(`CREATE INDEX IF NOT EXISTS "reffai_documents_fileName_idx" ON "reffai_documents"("fileName")`);

        // 6. Login Attempts Table (Rate Limiting)
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "login_attempts" (
                "id" SERIAL PRIMARY KEY,
                "ipAddress" TEXT NOT NULL UNIQUE,
                "attempts" INTEGER NOT NULL DEFAULT 1,
                "lastAttempt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "blockedUntil" TIMESTAMP
            )
        `);

        // 7. Announcements and Reads Table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS announcements (
                id SERIAL PRIMARY KEY,
                subject TEXT NOT NULL,
                content TEXT NOT NULL,
                target TEXT DEFAULT 'ALL',
                "senderId" INTEGER,
                "sentCount" INTEGER DEFAULT 0,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "announcement_reads" (
                "id" SERIAL PRIMARY KEY,
                "announcementId" INTEGER NOT NULL REFERENCES announcements("id") ON DELETE CASCADE,
                "userId" INTEGER NOT NULL REFERENCES users("id") ON DELETE CASCADE,
                "readAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE("announcementId", "userId")
            )
        `);


        // 8. Game Assignments Table
        await runQuery(`
            CREATE TABLE IF NOT EXISTS "game_assignments" (
                "id" SERIAL PRIMARY KEY,
                "tarih" TIMESTAMP NOT NULL,
                "saat" TEXT,
                "salon" TEXT,
                "aTeam" TEXT NOT NULL DEFAULT '',
                "bTeam" TEXT NOT NULL DEFAULT '',
                "ligTuru" TEXT,
                "hafta" INTEGER,
                "kategori" TEXT,
                "grup" TEXT,
                "hakem1" TEXT,
                "hakem2" TEXT,
                "sayiGorevlisi" TEXT,
                "saatGorevlisi" TEXT,
                "sutSaatiGorevlisi" TEXT,
                "gozlemci" TEXT,
                "sahaKomiseri" TEXT,
                "saglikci" TEXT,
                "istatistikci1" TEXT,
                "istatistikci2" TEXT,
                "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
        await runQuery(`CREATE INDEX IF NOT EXISTS "game_assignments_tarih_idx" ON "game_assignments"("tarih")`);

        console.log("[DB-HEAL] Schema check completed.");
    } catch (e: any) {
        console.error("[DB-HEAL] Critical failure:", e.message);
    } finally {
        isSchemaChecked = true;
    }
}
