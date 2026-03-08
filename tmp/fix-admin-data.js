
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const adminUsername = 'talat.mustafa.ozdemir50';
    const newEmail = 'talat.mustafa.ozdemir50@gmail.com'; // Adding a domain to make it valid for 2FA

    console.log(`Fixing admin user: ${adminUsername}`);

    // 1. Update the User record if needed (though username is fine)
    // 2. Update the Referee record associated with this user
    const user = await prisma.user.findUnique({
        where: { username: adminUsername },
        include: { referee: true }
    });

    if (!user) {
        console.error(`User ${adminUsername} not found.`);
        return;
    }

    if (user.referee) {
        await prisma.referee.update({
            where: { id: user.referee.id },
            data: { email: newEmail }
        });
        console.log(`Updated referee email to ${newEmail}`);
    } else {
        // If no referee record exists for some reason, create one or link it
        console.log("No referee record found for this admin. Checking if it's a general official...");
        const official = await prisma.generalOfficial.findUnique({
            where: { userId: user.id }
        });

        if (official) {
            await prisma.generalOfficial.update({
                where: { id: official.id },
                data: { email: newEmail }
            });
            console.log(`Updated general official email to ${newEmail}`);
        } else {
            // Create a referee record for the admin to facilitate 2FA email sending
            console.log("Creating referee record for admin to enable 2FA...");
            await prisma.referee.create({
                data: {
                    userId: user.id,
                    tckn: user.tckn,
                    firstName: 'Talat Mustafa',
                    lastName: 'Özdemir',
                    email: newEmail,
                    phone: '5555555555',
                    classification: 'ADMIN'
                }
            });
            console.log("Referee record created.");
        }
    }

    // Also ensure the user is approved and verified
    await prisma.user.update({
        where: { id: user.id },
        data: {
            isApproved: true,
            isVerified: true,
            isActive: true
        }
    });
    console.log("User updated to be active, approved, and verified.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
