import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.systemSetting.upsert({
        where: { key: 'CURRENT_WEEK_NUMBER' },
        update: { value: '25' },
        create: { key: 'CURRENT_WEEK_NUMBER', value: '25' },
    })

    await prisma.systemSetting.upsert({
        where: { key: 'AVAILABILITY_TARGET_DATE' },
        update: { value: '2026-02-28T00:00:00.000Z' },
        create: { key: 'AVAILABILITY_TARGET_DATE', value: '2026-02-28T00:00:00.000Z' },
    })

    console.log('Week 25 and Target Date (2026-02-28) set successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
