import { NextResponse } from "next/server";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const anadoluRegion = await prisma.region.findFirst({
            where: { name: 'Anadolu' }
        });

        if (!anadoluRegion) {
            return NextResponse.json({ error: "Anadolu region not found!" });
        }

        let results = [];

        const referee = await prisma.referee.findFirst({
            where: { firstName: 'Altan', lastName: 'Renksoy' }
        });

        if (referee) {
            await prisma.referee.update({
                where: { id: referee.id },
                data: { regions: { set: [{ id: anadoluRegion.id }] } }
            });
            results.push("Updated Referee Altan Renksoy");
        }

        const official = await prisma.generalOfficial.findFirst({
            where: { firstName: 'Altan', lastName: 'Renksoy' }
        });

        if (official) {
            await prisma.generalOfficial.update({
                where: { id: official.id },
                data: { regions: { set: [{ id: anadoluRegion.id }] } }
            });
            results.push("Updated GeneralOfficial Altan Renksoy");
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ error: e.message });
    }
}
