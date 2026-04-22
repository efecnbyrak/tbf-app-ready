import { db } from "@/lib/db";
import { OfficialListClient } from "./OfficialListClient";
import { ensureSchemaColumns } from "@/lib/db-heal";
import { verifySession } from "@/lib/session";

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ type?: string; status?: string }>;
}

export default async function OfficialsPage({ searchParams }: PageProps) {
    await ensureSchemaColumns();
    const session = await verifySession();
    const params = await searchParams;
    const selectedType = params.type;
    const selectedStatus = params.status;

    // Get current user details for tracking who is making changes
    const currentUser = await db.user.findUnique({
        where: { id: session.userId },
        select: { username: true, id: true }
    });
    // We will use username as the email equivalent if that's what's stored, or query referee/official email.
    const currentUserWithEmail = await db.user.findUnique({
        where: { id: session.userId },
        include: {
            referee: { select: { email: true } },
            official: { select: { email: true } }
        }
    });

    const currentUserEmail = currentUserWithEmail?.referee?.email || currentUserWithEmail?.official?.email || currentUserWithEmail?.username || "";


    // Fetch all records from the new dedicated table
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
                    role: {
                        select: { name: true }
                    },
                    penalties: true
                }
            },
            regions: true,
            assignments: {
                include: {
                    match: true
                },
                orderBy: {
                    match: {
                        date: 'desc'
                    }
                },
                take: 5
            },
            _count: {
                select: { assignments: true }
            }
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
