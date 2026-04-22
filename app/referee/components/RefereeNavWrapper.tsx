import { db } from "@/lib/db";
import { ResponsiveNav } from "../ResponsiveNav";
import { verifySession } from "@/lib/session";

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "ADMIN_IHK", "OBSERVER"];

interface RefereeNavWrapperProps {
    userId: number;
    role?: string;
    basePath?: string;
    preloadedName?: string;
    preloadedRoleType?: string;
    preloadedImageUrl?: string | null;
    preloadedBasePath?: string;
}

export async function RefereeNavWrapper({
    userId, role, basePath,
    preloadedName, preloadedRoleType, preloadedImageUrl, preloadedBasePath,
}: RefereeNavWrapperProps) {
    const resolvedRole = role ?? (await verifySession()).role;
    const isAdmin = ADMIN_ROLES.includes(resolvedRole);
    const showAdminLinks = isAdmin;

    let name = preloadedName ?? "Kullanıcı";
    let roleType = preloadedRoleType ?? "REFEREE";
    let imageUrl = preloadedImageUrl ?? null;
    let calculatedBasePath = basePath || preloadedBasePath || "/referee";

    // Only query DB when parent layout didn't pre-fetch the data
    if (!preloadedName) {
        const [referee, official] = await Promise.all([
            db.referee.findUnique({ where: { userId }, select: { firstName: true, imageUrl: true } }),
            db.generalOfficial.findUnique({ where: { userId }, select: { firstName: true, officialType: true, imageUrl: true } }),
        ]);

        if (referee) {
            name = referee.firstName;
            roleType = "REFEREE";
            imageUrl = referee.imageUrl;
            calculatedBasePath = basePath || "/referee";
        } else if (official) {
            name = official.firstName;
            roleType = official.officialType;
            imageUrl = official.imageUrl;
            calculatedBasePath = basePath || "/general";
        }
    }

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
