import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { username: { contains: 'efe' } },
                { referee: { firstName: { contains: 'efe' } } },
                { official: { firstName: { contains: 'efe' } } }
            ]
        },
        include: {
            role: true,
            referee: true,
            official: true
        }
    })
    console.dir(users, { depth: null })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
