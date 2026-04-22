import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "@/app/referee/matches/MatchesClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminMatchesPage() {
    const session = await verifySession();

    const user = await db.user.findUnique({
        where: { id: session.userId },
        select: {
            id: true,
            referee: { select: { firstName: true, lastName: true } },
            official: { select: { firstName: true, lastName: true } }
        },
    });

    if (!user) {
        redirect("/basket/admin/login");
    }

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight uppercase italic underline decoration-red-600 decoration-4">Maçlarım</h1>
                <p className="text-zinc-500 font-medium italic">Size atanan maçları buradan takip edebilirsiniz.</p>
            </header>

            <MatchesClient
                firstName={firstName}
                lastName={lastName}
            />
        </div>
    );
}
