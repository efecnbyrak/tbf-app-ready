import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AtamalarClient } from "./AtamalarClient";
import { getTeamNames, getAssignments } from "@/app/actions/atamalar";

export const dynamic = "force-dynamic";

export default async function AtamalarPage() {
    const session = await verifySession();

    if (session.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const [assignmentsResult, teamNamesResult, referees, officials] = await Promise.all([
        getAssignments(),
        getTeamNames(),
        db.referee.findMany({
            select: { firstName: true, lastName: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        }),
        db.generalOfficial.findMany({
            select: { firstName: true, lastName: true, officialType: true },
            orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        }),
    ]);

    const toPersonOption = (first: string, last: string) => ({ name: `${first} ${last}`.trim() });

    const refereeOptions = referees.map(r => toPersonOption(r.firstName, r.lastName));

    const tableOfficials = officials
        .filter(o => ["TABLE", "TABLE_STATISTICIAN", "TABLE_HEALTH"].includes(o.officialType))
        .map(o => toPersonOption(o.firstName, o.lastName));

    const observers = officials
        .filter(o => o.officialType === "OBSERVER")
        .map(o => toPersonOption(o.firstName, o.lastName));

    const fieldCommissioners = officials
        .filter(o => o.officialType === "FIELD_COMMISSIONER")
        .map(o => toPersonOption(o.firstName, o.lastName));

    const healthOfficials = officials
        .filter(o => ["HEALTH", "TABLE_HEALTH"].includes(o.officialType))
        .map(o => toPersonOption(o.firstName, o.lastName));

    const statisticians = officials
        .filter(o => ["STATISTICIAN", "TABLE_STATISTICIAN"].includes(o.officialType))
        .map(o => toPersonOption(o.firstName, o.lastName));

    return (
        <AtamalarClient
            initialAssignments={(assignmentsResult.assignments || []) as any}
            teamNames={teamNamesResult.teams || []}
            referees={refereeOptions}
            tableOfficials={tableOfficials}
            observers={observers}
            fieldCommissioners={fieldCommissioners}
            healthOfficials={healthOfficials}
            statisticians={statisticians}
        />
    );
}
