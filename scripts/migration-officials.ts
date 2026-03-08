
import { PrismaClient } from '@prisma/client';

const connectionString = 'postgresql://neondb_owner:npg_uocq8xQ3pwsk@ep-cool-unit-agjul0zo-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: connectionString,
    },
  },
});

async function migrate() {
  console.log('🚀 Starting Robust Migration...');

  try {
    // 1. Synchronize Roles
    console.log('--- Step 1: Synchronizing Roles ---');
    const roles = ['SUPER_ADMIN', 'ADMIN_IHK', 'REFEREE', 'GENERAL_OFFICIAL'];
    const roleMap: Record<string, number> = {};

    for (const roleName of roles) {
      console.log(`Working on role: ${roleName}...`);
      const role = await prisma.role.upsert({
        where: { name: roleName },
        create: { name: roleName },
        update: {}
      });
      roleMap[roleName] = role.id;
      console.log(`✅ Role ${roleName} synchronized (ID: ${role.id})`);
    }

    // 2. Query officials to migrate
    console.log('--- Step 2: Querying Officials ---');
    const standardReferees = ['A', 'B', 'C', 'IL_HAKEMI', 'ADAY_HAKEM'];
    const officialsToMigrate = await prisma.referee.findMany({
      where: {
        classification: {
          notIn: standardReferees
        }
      },
      include: {
        regions: true
      }
    });
    console.log(`Found ${officialsToMigrate.length} officials to migrate.`);

    for (const off of officialsToMigrate) {
      console.log(`Migrating: ${off.firstName} ${off.lastName} (${off.officialType})`);

      let finalType = off.officialType;
      // Ahmet Yılmaz Fix
      if ((off.firstName.includes('Ahmet') && off.lastName.includes('Yılmaz')) || off.phone.includes('55555555')) {
        console.log(`🎯 Applying specific fix for Ahmet Yılmaz: Setting type to OBSERVER`);
        finalType = 'OBSERVER';
      }

      const newOfficial = await prisma.generalOfficial.create({
        data: {
          userId: off.userId,
          tckn: off.tckn,
          firstName: off.firstName,
          lastName: off.lastName,
          email: off.email,
          phone: off.phone,
          address: off.address,
          job: off.job,
          officialType: finalType || 'OBSERVER',
          imageUrl: off.imageUrl,
          points: off.points,
          rating: off.rating,
          createdAt: off.createdAt,
          updatedAt: off.updatedAt,
          regions: {
            connect: off.regions.map(r => ({ id: r.id }))
          }
        }
      });

      // Update user role
      await prisma.user.update({
        where: { id: off.userId },
        data: { roleId: roleMap['GENERAL_OFFICIAL'] }
      });

      // Remap Availability Forms
      const formUpdate = await prisma.availabilityForm.updateMany({
        where: { refereeId: off.id },
        data: {
          officialId: newOfficial.id,
          refereeId: null as any
        }
      });
      console.log(`   Mapped ${formUpdate.count} availability forms.`);

      // Remap Match Assignments
      const assignmentUpdate = await prisma.matchAssignment.updateMany({
        where: { refereeId: off.id },
        data: {
          officialId: newOfficial.id,
          refereeId: null as any
        }
      });
      console.log(`   Mapped ${assignmentUpdate.count} match assignments.`);
    }

    // 3. Cleanup
    console.log('--- Step 3: Cleanup ---');
    const deleteCount = await prisma.referee.deleteMany({
      where: {
        classification: {
          notIn: standardReferees
        }
      }
    });
    console.log(`✅ Deleted ${deleteCount.count} migrated records from Referee table.`);

    console.log('🎉 Migration completed successfully!');

  } catch (e: any) {
    console.error('❌ Migration failed:', e);
    if (e.code) console.error('Error Code:', e.code);
    if (e.meta) console.error('Error Meta:', e.meta);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
