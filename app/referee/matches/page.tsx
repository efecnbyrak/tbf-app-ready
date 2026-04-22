import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { MatchesClient } from "./MatchesClient";
import { redirect } from "next/navigation";
import { getUserMatchesStore } from "@/lib/matches-store";

export const dynamic = "force-dynamic";



export default async function MatchesPage() {
    const session = await verifySession();

    const [user, cachedStore, allReferees, allOfficials] = await Promise.all([
        db.user.findUnique({
            where: { id: session.userId },
            include: { referee: true, official: true },
        }),
        getUserMatchesStore(session.userId).catch(() => null),
        db.referee.findMany({ select: { firstName: true, lastName: true, phone: true } }),
        db.generalOfficial.findMany({ select: { firstName: true, lastName: true, phone: true } })
    ]);

    const personnelPhones: Record<string, string> = {};
    const normalizeName = (first: string, last: string) => {
        return `${first} ${last}`.replace(/İ/g, "i").replace(/I/g, "ı")
            .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
            .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
            .replace(/Ç/g, "ç").toLowerCase().replace(/\s+/g, " ").trim();
    };

    allReferees.forEach(r => {
        if (r.phone) personnelPhones[normalizeName(r.firstName, r.lastName)] = r.phone;
    });
    allOfficials.forEach(o => {
        if (o.phone) personnelPhones[normalizeName(o.firstName, o.lastName)] = o.phone;
    });

    const firstName = user?.referee?.firstName || user?.official?.firstName || "";
    const lastName = user?.referee?.lastName || user?.official?.lastName || "";
    const fullName = `${firstName} ${lastName}`.toLowerCase().trim();



    return (
        <MatchesClient
            firstName={firstName}
            lastName={lastName}
            initialMatches={cachedStore?.matches || []}
            initialLastSync={cachedStore?.lastSync || null}
            initialPersonnelPhones={personnelPhones}
        />
    );
}
