const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.referee.findMany({
        where: {
            OR: [
                { firstName: { contains: 'Ahmet', mode: 'insensitive' } },
                { lastName: { contains: 'Yılmaz', mode: 'insensitive' } },
                { tckn: '55555555555' }
            ]
        },
        include: {
            user: {
                include: {
                    role: true
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
