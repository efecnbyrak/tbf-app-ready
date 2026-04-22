import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "@/app/referee/matches/MatchesClient";

export const dynamic = "force-dynamic";

export default async function GeneralMatchesPage() {
    const session = await verifySession();

    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { referee: true, official: true },
    });

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";

    return (
        <MatchesClient
            firstName={firstName}
            lastName={lastName}
        />
    );
}
