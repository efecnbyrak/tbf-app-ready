
import { PrismaClient } from '@prisma/client';

async function test() {
    console.log("Testing connectivity with dev.db...");
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: 'postgresql://postgres:postgres@localhost:5432/tbf_system' // Fallback guess for local pg
            }
        }
    });

    try {
        await prisma.$connect();
        console.log("Connected successfully!");
        const users = await prisma.user.count();
        console.log(`User count: ${users}`);
    } catch (e) {
        console.error("Connection failed:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
