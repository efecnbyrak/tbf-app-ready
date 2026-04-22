import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const session = await verifySession();
        if (!session.userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get user details to check groups
        const user = await db.user.findUnique({
            where: { id: session.userId },
            include: {
                referee: true,
                official: true
            }
        });

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2. Identify user groups
        const userGroups = ["ALL"];
        if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") userGroups.push("ADMIN");

        if (user.referee) {
            userGroups.push("REFEREE");
            if (user.referee.classification) userGroups.push(user.referee.classification);
        }

        if (user.official) {
            userGroups.push("OFFICIAL");
            if (user.official.officialType === "Gözlemci") userGroups.push("OBSERVER");
            else userGroups.push("TABLE");
        }

        // 3. Fetch active assignments
        const assignments = await db.examAssignment.findMany({
            where: {
                isActive: true,
                OR: userGroups.map(group => ({
                    targetGroups: { contains: group }
                }))
            },
            include: {
                attempts: {
                    where: {
                        OR: [
                            { refereeId: user.referee?.id || -1 },
                            { officialId: user.official?.id || -1 }
                        ]
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 4. Map and check status
        const results = assignments.map(a => {
            const lastAttempt = a.attempts[0];
            const isCompleted = !!lastAttempt;
            const isExpired = a.dueDate ? new Date(a.dueDate).getTime() < Date.now() : false;

            return {
                ...a,
                isCompleted,
                isExpired,
                score: lastAttempt?.score || null
            };
        });

        return NextResponse.json(results);
    } catch (error) {
        console.error("Fetch Assignments Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
