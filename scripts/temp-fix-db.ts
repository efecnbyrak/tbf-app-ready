import { db } from "../lib/db";

async function fix() {
    console.log("Attempting to fix database schema...");
    try {
        await db.$executeRawUnsafe(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS "isApproved" BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS "suspendedUntil" TIMESTAMP;
        `);
        console.log("✅ Success: Columns 'isApproved' and 'suspendedUntil' added to 'users' table.");
    } catch (error: any) {
        console.error("❌ Error fixing database:", error.message);
        console.log("If the error is about 'DATABASE_URL', please ensure your .env file is present.");
    } finally {
        await db.$disconnect();
    }
}

fix();
