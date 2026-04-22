import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserMatchesClient } from "./UserMatchesClient";

export const dynamic = "force-dynamic";

export default async function UserMatchesPage() {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN") redirect("/admin");

    const users = await db.user.findMany({
        where: {
            OR: [
                { referee: { isNot: null } },
                { official: { isNot: null } },
            ],
        },
        select: {
            id: true,
            matchStore: true,
            referee: {
                select: { firstName: true, lastName: true, imageUrl: true, classification: true },
            },
            official: {
                select: { firstName: true, lastName: true, imageUrl: true, officialType: true },
            },
        },
        orderBy: { id: "asc" },
    });

    const userList = users.map((u) => {
        const profile = u.referee || u.official;
        const store = u.matchStore as any;
        return {
            id: u.id,
            firstName: profile?.firstName || "",
            lastName: profile?.lastName || "",
            imageUrl: profile?.imageUrl || null,
            isOfficial: !u.referee,
            officialType: (u.official as any)?.officialType || null,
            classification: (u.referee as any)?.classification || null,
            matchCount: store?.matches?.length ?? 0,
            lastSync: store?.lastSync ?? null,
        };
    });

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight uppercase italic underline decoration-red-600 decoration-4">
                    Kullanıcı Maçları
                </h1>
                <p className="text-zinc-500 font-medium italic">
                    Tüm kullanıcıların atanmış maçlarını görüntüleyin.
                </p>
            </header>

            <UserMatchesClient users={userList} />
        </div>
    );
}
