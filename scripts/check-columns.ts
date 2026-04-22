
import { PrismaClient } from '@prisma/client';

const connectionString = 'postgresql://neondb_owner:npg_uocq8xQ3pwsk@ep-cool-unit-agjul0zo-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString,
        },
    },
});

async function check() {
    try {
        console.log('--- Checking table columns for referees ---');
        const columns: any[] = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'referees'
        `;
        console.log('Columns in referees:');
        columns.forEach(c => console.log(`- ${c.column_name} (${c.data_type})`));

        console.log('\n--- Checking row count ---');
        const count = await prisma.referee.count();
        console.log(`Referee count: ${count}`);

        if (count > 0) {
            const first = await prisma.referee.findFirst();
            console.log('First record sample:', first);
        }

    } catch (e: any) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
