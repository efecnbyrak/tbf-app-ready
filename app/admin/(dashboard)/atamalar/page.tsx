import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { AtamalarClient } from "./AtamalarClient";
import { getAssignments } from "@/app/actions/atamalar";
import { getCurrentWeekNumber } from "@/lib/hafta-utils";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export default async function AtamalarPage() {
    const session = await verifySession();

    if (session.role !== "SUPER_ADMIN") {
        redirect("/admin");
    }

    const currentWeek = getCurrentWeekNumber();

    // Load static data from archive extraction
    let staticData = { teams: [] as string[], categories: [] as string[], groups: [] as string[], salons: [] as string[] };
    try {
        const dataPath = path.join(process.cwd(), "data", "atama-static-data.json");
        staticData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    } catch {}

    const [assignmentsResult, referees, officials] = await Promise.all([
        getAssignments(),
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
            teamNames={staticData.teams}
            categories={staticData.categories}
            groups={staticData.groups}
            salons={staticData.salons}
            currentWeek={currentWeek}
            referees={refereeOptions}
            tableOfficials={tableOfficials}
            observers={observers}
            fieldCommissioners={fieldCommissioners}
            healthOfficials={healthOfficials}
            statisticians={statisticians}
        />
    );
}
