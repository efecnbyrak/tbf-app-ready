
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminUsername = 'talat.mustafa.ozdemir50';
    const user = await prisma.user.findUnique({
        where: { username: adminUsername },
        include: { role: true }
    });

    if (user) {
        console.log(`User: ${user.username}`);
        console.log(`Role: ${user.role.name}`);

        if (user.role.name !== 'SUPER_ADMIN') {
            const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
            if (superAdminRole) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { roleId: superAdminRole.id }
                });
                console.log("Updated user to SUPER_ADMIN role.");
            } else {
                const newRole = await prisma.role.create({ data: { name: 'SUPER_ADMIN' } });
                await prisma.user.update({
                    where: { id: user.id },
                    data: { roleId: newRole.id }
                });
                console.log("Created SUPER_ADMIN role and updated user.");
            }
        }
    } else {
        console.log("User not found.");
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
