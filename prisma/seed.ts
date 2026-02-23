import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Create Roles
    const roles = ['SUPER_ADMIN', 'ADMIN_IHK', 'REFEREE'];
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            create: { name: roleName },
            update: {}
        });
    }
    console.log('✅ Synchronized Roles: SUPER_ADMIN, ADMIN_IHK, REFEREE');

    const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPER_ADMIN' } });
    const refereeRole = await prisma.role.findUniqueOrThrow({ where: { name: 'REFEREE' } });

    // 2.5 Create Default Regions
    const regions = ["Avrupa", "Asya", "BGM"];
    for (const name of regions) {
        await prisma.region.upsert({
            where: { name },
            create: { name },
            update: {}
        });
    }
    console.log('✅ Created Regions: Avrupa, Asya, BGM');

    // 3. Create or Update Permanent Admin User
    const adminPassword = 'talat!56742';
    const adminUsername = 'talat.mustafa.ozdemir50';
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    await prisma.user.upsert({
        where: { username: adminUsername },
        update: {
            password: hashedAdminPassword,
            roleId: adminRole.id,
            isApproved: true,
            isVerified: true
        },
        create: {
            username: adminUsername,
            tckn: '11111111111',
            password: hashedAdminPassword,
            roleId: adminRole.id,
            isApproved: true,
            isVerified: true
        }
    });

    // Also ensure a simpler "admin" fallback exists
    const simpleAdminPass = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: simpleAdminPass,
            roleId: adminRole.id,
            isApproved: true,
            isVerified: true
        },
        create: {
            username: 'admin',
            tckn: '22222222222',
            password: simpleAdminPass,
            roleId: adminRole.id,
            isApproved: true,
            isVerified: true
        }
    });

    console.log(`✅ Fixed Admin Users: ${adminUsername} and "admin"`);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
