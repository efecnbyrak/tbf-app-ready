import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
    try {
        const talatReferees = await prisma.referee.findMany({
            where: {
                OR: [
                    { firstName: { contains: "TALAT", mode: "insensitive" } },
                    { lastName: { contains: "ÖZDEMİR", mode: "insensitive" } }
                ]
            }
        });

        let updatedCount = 0;
        for (const r of talatReferees) {
            if (r.firstName && r.firstName.toUpperCase().includes("TALAT")) {
                await prisma.referee.update({
                    where: { id: r.id },
                    data: { phone: "535 624 27 86" }
                });
                updatedCount++;
            }
        }

        return NextResponse.json({ success: true, updatedCount });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
