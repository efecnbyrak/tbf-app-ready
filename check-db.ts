
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const users = await prisma.user.findMany({
            include: { role: true }
        });
        console.log('--- USERS IN DB ---');
        users.forEach(u => {
            console.log(`ID: ${u.id}, Username: ${u.username}, Role: ${u?.role?.name}, Approved: ${u.isApproved}, Verified: ${u.isVerified}`);
        });

        const roles = await prisma.role.findMany();
        console.log('--- ROLES IN DB ---');
        roles.forEach(r => console.log(`ID: ${r.id}, Name: ${r.name}`));

    } catch (e) {
        console.error('Error checking DB:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
