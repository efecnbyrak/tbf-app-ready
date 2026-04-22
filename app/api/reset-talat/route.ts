import { NextResponse } from 'next/server';
import { db as prisma } from '@/lib/db';

export async function GET() {
    try {
        let message = '';

        // 1. Find user by checking both Referee and GeneralOfficial models via nested object query
        const u = await prisma.user.findFirst({
            where: {
                OR: [
                    { referee: { firstName: { contains: "TALAT", mode: "insensitive" }, lastName: { contains: "ÖZDEMİR", mode: "insensitive" } } },
                    { official: { firstName: { contains: "TALAT", mode: "insensitive" }, lastName: { contains: "ÖZDEMİR", mode: "insensitive" } } }
                ]
            }
        });

        if (u) {
            await prisma.user.update({
                where: { id: u.id },
                data: { matchStore: null, forceRefresh: true }
            });
            message += 'Talat Mustafa Özdemir maçları sıfırlandı. ';
        }

        // 2. Fallback to directly checking the models without nesting in case User is detached
        const r = await prisma.referee.findFirst({
            where: { firstName: { contains: "TALAT", mode: "insensitive" }, lastName: { contains: "ÖZDEMİR", mode: "insensitive" } }
        });
        if (r) {
            await prisma.referee.update({
                where: { id: r.id },
                data: { phone: "535 624 27 86" }
            });
            message += 'Hakem telefon numarası güncellendi. ';

            // Just in case user search failed earlier
            if (!u) {
                await prisma.user.update({
                    where: { id: r.userId },
                    data: { matchStore: null, forceRefresh: true }
                });
                message += 'Hakem maçları sıfırlandı. ';
            }
        }

        const o = await prisma.generalOfficial.findFirst({
            where: { firstName: { contains: "TALAT", mode: "insensitive" }, lastName: { contains: "ÖZDEMİR", mode: "insensitive" } }
        });
        if (o) {
            await prisma.generalOfficial.update({
                where: { id: o.id },
                data: { phone: "535 624 27 86" }
            });
            message += 'Masa/Gözlemci telefon numarası güncellendi. ';

            // Just in case user search failed earlier
            if (!u && !r) {
                await prisma.user.update({
                    where: { id: o.userId },
                    data: { matchStore: null, forceRefresh: true }
                });
                message += 'Yetkili maçları sıfırlandı. ';
            }
        }

        if (!message) {
            message = "Kullanıcı bulunamadı!";
        }

        return NextResponse.json({ success: true, message });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
