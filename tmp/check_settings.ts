import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const settings = await prisma.systemSetting.findMany()
    console.log('--- System Settings ---')
    settings.forEach(s => {
        console.log(`${s.key}: ${s.value}`)
    })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
