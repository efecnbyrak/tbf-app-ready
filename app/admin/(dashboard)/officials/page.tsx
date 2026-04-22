import { db } from "@/lib/db";
import { OfficialListClient } from "./OfficialListClient";
import { verifySession } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ type?: string; status?: string }>;
}

export default async function OfficialsPage({ searchParams }: PageProps) {
    const session = await verifySession();
    const params = await searchParams;
    const selectedType = params.type;
    const selectedStatus = params.status;

    // Single query for current user email
    const currentUserWithEmail = await db.user.findUnique({
        where: { id: session.userId },
        select: {
            username: true,
            referee: { select: { email: true } },
            official: { select: { email: true } }
        }
    });

    const currentUserEmail = currentUserWithEmail?.referee?.email || currentUserWithEmail?.official?.email || currentUserWithEmail?.username || "";


    // Fetch all records — optimized with select to reduce data transfer
    const allOfficials = await db.generalOfficial.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    isActive: true,
                    isApproved: true,
                    createdAt: true,
                    lastLoginAt: true,
                    role: { select: { name: true } },
                    penalties: { select: { id: true, type: true, reason: true, isActive: true, startDate: true, endDate: true } }
                }
            },
            regions: { select: { id: true, name: true } },
            _count: { select: { assignments: true } }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Filtering logic to match URL params
    const officials = allOfficials.filter((off: any) => {
        const type = off.officialType || "OBSERVER";

        // Status filter
        if (selectedStatus === "unapproved") {
            if (off.user?.isApproved) return false;
        } else if (selectedStatus === "managers") {
            return off.user?.role?.name === "ADMIN";
        } else if (off.user?.isApproved === false) {
            return false; // Default: hide unapproved
        }

        // Type filter
        if (selectedType) {
            return type === selectedType;
        }

        return true; // Show all in this table
    });

    // Create mapping for client component compatibility
    const refereeTypeMap: Record<string, string> = {};
    allOfficials.forEach((off: any) => {
        refereeTypeMap[off.id] = off.officialType || "OBSERVER";
    });

    // Plain data for client component
    const plainOfficials = JSON.parse(JSON.stringify(officials));

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight uppercase">Genel Görevliler</h1>
                <p className="text-zinc-500 font-medium mt-1">Masa görevlileri, gözlemciler ve teknik kadro yönetimi.</p>
            </header>

            <OfficialListClient
                initialOfficials={plainOfficials}
                refereeTypeMap={refereeTypeMap}
                currentUserRole={session.role}
                currentUserEmail={currentUserEmail}
                selectedType={selectedType}
                selectedStatus={selectedStatus}
            />
        </div>
    );
}
