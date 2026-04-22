import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
    try {
        const r = await prisma.referee.findFirst({
            where: {
                firstName: { contains: "Efe Can", mode: "insensitive" },
                lastName: { contains: "Bayrak", mode: "insensitive" }
            }
        });

        if (r) {
            await prisma.user.update({
                where: { id: r.userId },
                data: {
                    matchStore: null,
                    forceRefresh: true
                }
            });
            return NextResponse.json({ success: true, message: `Matches reset for ${r.firstName} ${r.lastName}` });
        } else {
            return NextResponse.json({ success: false, message: 'User not found' });
        }
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
