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

    // 3. Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
        where: { tckn: '11111111111' }
    });

    if (!existingAdmin) {
        // Hash the password
        const hashedPassword = await bcrypt.hash('talat!56742', 10);

        // Create admin user
        await prisma.user.create({
            data: {
                username: 'talat.mustafa.ozdemir50',
                tckn: '11111111111',
                password: hashedPassword,
                roleId: adminRole.id
            }
        });

        console.log('✅ Created default admin user');
        console.log('   Username: talat.mustafa.ozdemir50');
        console.log('   TCKN: 11111111111');
        console.log('   Password: talat!56742');
    } else {
        console.log('ℹ️  Admin user already exists, skipping...');
    }

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
