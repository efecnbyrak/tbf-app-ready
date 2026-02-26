const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            referee: true,
            role: true
        },
        where: {
            referee: {
                OR: [
                    { firstName: { contains: 'Ahmet' }, lastName: { contains: 'Yılmaz' } },
                    { firstName: { contains: 'Ahmet' }, lastName: { contains: 'Yilmaz' } }
                ]
            }
        }
    });

    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
