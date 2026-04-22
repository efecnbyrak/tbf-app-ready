import { db } from "@/lib/db";
import { ResponsiveNav } from "../ResponsiveNav";
import { verifySession } from "@/lib/session";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK", "OBSERVER"];

export async function RefereeNavWrapper({ userId, role, basePath }: { userId: number, role?: string, basePath?: string }) {
    // If role is passed from the parent layout (already verified), skip re-verifying session.
    // Fall back to verifySession() only when called standalone without a role prop.
    const resolvedRole = role ?? (await verifySession()).role;
    const isAdmin = ADMIN_ROLES.includes(resolvedRole);

    // Run both queries in parallel — saves one full DB round-trip for GeneralOfficials
    const [referee, official] = await Promise.all([
        db.referee.findUnique({ where: { userId } }),
        db.generalOfficial.findUnique({ where: { userId } }),
    ]);

    const isObserver = official?.officialType === "OBSERVER";
    const showAdminLinks = isAdmin; // Universal for all Official-Admins

    let roleType = "REFEREE";
    let name = "Kullanıcı";
    let imageUrl = null;

    if (referee) {
        name = referee.firstName;
        roleType = "REFEREE";
        imageUrl = referee.imageUrl;
    } else if (official) {
        name = official.firstName;
        roleType = official.officialType;
        imageUrl = official.imageUrl;
    }

    const calculatedBasePath = basePath || (referee ? "/referee" : "/general");

    return (
        <ResponsiveNav
            refereeName={name}
            roleType={roleType}
            basePath={calculatedBasePath}
            isAdminObserver={showAdminLinks}
            imageUrl={imageUrl}
            canSeeMatches={true}
        />
    );
}
