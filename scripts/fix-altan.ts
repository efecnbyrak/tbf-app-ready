import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Looking for Altan Renksoy...");

    // Find Anadolu region
    const anadoluRegion = await prisma.region.findFirst({
        where: { name: 'Anadolu' }
    });

    if (!anadoluRegion) {
        console.error("Anadolu region not found!");
        return;
    }
    console.log("Found Anadolu Region:", anadoluRegion.id);

    // Look in Referee
    const referee = await prisma.referee.findFirst({
        where: { firstName: 'Altan', lastName: 'Renksoy' }
    });

    if (referee) {
        await prisma.referee.update({
            where: { id: referee.id },
            data: {
                regions: {
                    set: [{ id: anadoluRegion.id }]
                }
            }
        });
        console.log("Updated Referee Altan Renksoy to Anadolu Region");
    }

    // Look in GeneralOfficial
    const official = await prisma.generalOfficial.findFirst({
        where: { firstName: 'Altan', lastName: 'Renksoy' }
    });

    if (official) {
        await prisma.generalOfficial.update({
            where: { id: official.id },
            data: {
                regions: {
                    set: [{ id: anadoluRegion.id }]
                }
            }
        });
        console.log("Updated GeneralOfficial Altan Renksoy to Anadolu Region");
    }

    if (!referee && !official) {
        console.log("Could not find Altan Renksoy in either Referee or GeneralOfficial table.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
