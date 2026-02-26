
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        console.log('--- FINDING AHMET YILMAZ ---');
        const ahmet = await prisma.referee.findMany({
            where: {
                OR: [
                    { firstName: { contains: 'Ahmet', mode: 'insensitive' } },
                    { lastName: { contains: 'Yılmaz', mode: 'insensitive' } },
                    { phone: { contains: '555' } }
                ]
            },
            include: { user: { include: { role: true } } }
        });

        ahmet.forEach(r => {
            console.log(`ID: ${r.id}, Name: ${r.firstName} ${r.lastName}, Phone: ${r.phone}, Class: ${r.classification}, Type: ${r.officialType}`);
            console.log(`   User ID: ${r.userId}, Username: ${r.user.username}, Role: ${r.user.role.name}`);
        });

        console.log('\n--- FINDING BELIRLENMEMIS OFFICIALS ---');
        const unspecified = await prisma.referee.findMany({
            where: {
                OR: [
                    { classification: 'BELIRLENMEMIS' },
                    { classification: '' },
                    { classification: null as any }
                ]
            }
        });

        unspecified.forEach(r => {
            console.log(`ID: ${r.id}, Name: ${r.firstName} ${r.lastName}, Class: ${r.classification}, Type: ${r.officialType}`);
        });

    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
