import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting username migration...");

    // Fetch all users except the admin
    const users = await prisma.user.findMany({
        where: {
            username: {
                not: "talat.mustafa.ozdemir50"
            }
        },
        include: {
            referee: true,
            official: true
        }
    });

    let updatedCount = 0;
    let fallbackCount = 0;

    for (const user of users) {
        let email = user.referee?.email || user.official?.email;

        // If we have an email and the username is not already the email
        if (email && user.username !== email) {
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { username: email }
                });
                console.log(`Updated user ${user.id}: changed from ${user.username} to ${email}`);
                updatedCount++;
            } catch (e: any) {
                console.error(`Failed to update user ${user.id} to ${email}:`, e.message);
            }
        }
        // If they don't have an email in referee/official tables but their username looks like a TCKN
        else if (!email && /^\d{11}$/.test(user.username)) {
            const fallbackEmail = `user${user.id}_tckn_removed@bks.local`;
            try {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { username: fallbackEmail }
                });
                console.log(`Updated user ${user.id}: changed from ${user.username} to ${fallbackEmail}`);
                fallbackCount++;
            } catch (e: any) {
                console.error(`Failed to update fallback for user ${user.id}:`, e.message);
            }
        }
    }

    console.log(`Migration complete. Total updated with valid email: ${updatedCount}, Total updated with fallback: ${fallbackCount}`);
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
