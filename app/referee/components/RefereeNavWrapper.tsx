import { db } from "@/lib/db";
import { ResponsiveNav } from "../ResponsiveNav";
import { verifySession } from "@/lib/session";

export async function RefereeNavWrapper({ userId, basePath }: { userId: number, basePath?: string }) {
    const session = await verifySession();
    const isAdmin = session.role === "ADMIN" || session.role === "SUPER_ADMIN" || session.role === "ADMIN_IHK" || session.role === "OBSERVER";

    const referee = await db.referee.findUnique({
        where: { userId }
    });

    const official = await db.generalOfficial.findUnique({
        where: { userId }
    });

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
