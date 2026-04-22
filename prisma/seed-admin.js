
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'talat.mustafa.ozdemir50'; // User provided username/email
    const password = 'talat!56742';

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if role exists, if not create it
    let adminRole = await prisma.role.findUnique({
        where: { name: 'ADMIN' }
    });

    if (!adminRole) {
        console.log("Creating ADMIN role...");
        adminRole = await prisma.role.create({
            data: { name: 'ADMIN' }
        });
    }

    // Create User
    try {
        const user = await prisma.user.upsert({
            where: { username: email },
            update: {
                password: hashedPassword,
                roleId: adminRole.id
            },
            create: {
                username: email,
                tckn: '11111111111',
                password: hashedPassword,
                roleId: adminRole.id,
                referee: {
                    create: {
                        tckn: '11111111111',
                        firstName: 'Talat Mustafa',
                        lastName: 'Özdemir',
                        email: email,
                        phone: '5555555555',
                        classification: 'Admin',
                        officialType: 'REFEREE' // Default type
                    }
                }
            }
        });
        console.log(`Admin user ${user.username} created/updated successfully.`);
    } catch (e) {
        console.error("Error creating user:", e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
