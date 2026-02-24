import { db } from "@/lib/db";
import { OfficialListClient } from "./OfficialListClient";
import { ensureSchemaColumns } from "@/app/actions/auth";
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

    // Fetch Referee Types manually via Raw Query to bypass stale Prisma Client
    const refereeTypesRaw = await db.$queryRaw<Array<{ id: number, officialType: string }>>`
        SELECT id, "officialType" FROM referees
    `;

    // Create mapping for client component
    const refereeTypeMap: Record<string, string> = {};
    refereeTypesRaw.forEach((r: any) => {
        refereeTypeMap[r.id] = r.officialType || "REFEREE";
    });

    // Fetch all records
    const allOfficials = await db.referee.findMany({
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
                    }
                }
            } as any,
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
        const type = refereeTypeMap[off.id] || "REFEREE";

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

        // Default: all non-referees that are not admins (unless status=managers is set)
        return type !== "REFEREE" && off.user?.role?.name !== "ADMIN";
    });

    // Plain data for client component
    const plainOfficials = JSON.parse(JSON.stringify(officials));

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tight italic uppercase">Genel Görevliler</h1>
                <p className="text-zinc-500 font-medium mt-1">Masa görevlileri, gözlemciler ve teknik kadro yönetimi.</p>
            </header>

            <OfficialListClient
                initialOfficials={plainOfficials}
                refereeTypeMap={refereeTypeMap}
                currentUserRole={session.role}
                selectedType={selectedType}
                selectedStatus={selectedStatus}
            />
        </div>
    );
}
