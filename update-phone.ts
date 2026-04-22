import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updatePhone() {
    console.log("Searching for TALAT MUSTAFA ÖZDEMİR...");
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: "TALAT", mode: "insensitive" } },
                { lastName: { contains: "ÖZDEMİR", mode: "insensitive" } }
            ]
        }
    });
    console.log("Found users:", users.map(u => ({ id: u.id, name: u.firstName + ' ' + u.lastName, phone: u.phone })));

    let updated = 0;
    for (const u of users) {
        if (u.firstName.toUpperCase().includes("TALAT")) {
            await prisma.user.update({
                where: { id: u.id },
                data: { phone: "05356242786" } // standardizing to 11 digits format used commonly, or "535 624 27 86"
            });
            updated++;
            console.log(`Updated phone for ${u.firstName} ${u.lastName}`);
        }
    }
    console.log(`Update complete. Modified ${updated} users.`);
}

updatePhone().catch(console.error).finally(() => prisma.$disconnect());
