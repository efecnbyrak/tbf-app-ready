
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const tckn = '22225555666';
    const password = 'BttnX3w4ENEcftyM';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating/Updating test observer account: ${tckn}`);

    // 1. Find or create ADMIN role
    let adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
    });

    if (!adminRole) {
        console.log("Creating ADMIN role...");
        adminRole = await prisma.role.create({
            data: { name: 'ADMIN' }
        });
    }

    // 2. Create/Upsert User
    const user = await prisma.user.upsert({
        where: { tckn: tckn },
        update: {
            password: hashedPassword,
            roleId: adminRole.id,
            isApproved: true,
            isVerified: true,
            isActive: true
        },
        create: {
            username: tckn,
            tckn: tckn,
            password: hashedPassword,
            roleId: adminRole.id,
            isApproved: true,
            isVerified: true,
            isActive: true
        }
    });

    console.log(`User ${user.username} (ID: ${user.id}) prepared.`);

    // 3. Create/Upsert GeneralOfficial record (OBSERVER)
    const official = await prisma.generalOfficial.upsert({
        where: { userId: user.id },
        update: {
            officialType: 'OBSERVER',
            firstName: 'Test',
            lastName: 'Gözlemcisi',
            email: 'test.gozlemci@example.com', // Placeholder
            phone: '5000000000',
            tckn: tckn
        },
        create: {
            userId: user.id,
            tckn: tckn,
            firstName: 'Test',
            lastName: 'Gözlemcisi',
            email: 'test.gozlemci@example.com',
            phone: '5000000000',
            officialType: 'OBSERVER'
        }
    });

    console.log(`GeneralOfficial (OBSERVER) record linked to user.`);
    console.log("Account creation complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
