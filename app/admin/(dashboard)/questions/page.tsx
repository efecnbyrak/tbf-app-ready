import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import QuestionsHubClient from "./QuestionsHubClient";

export const dynamic = 'force-dynamic';

export default async function QuestionsHubPage() {
    const session = await verifySession();

    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: { official: true }
    });
    
    const isSuperAdmin = session.role === "SUPER_ADMIN";
    const isObserverAdmin = (session.role === "ADMIN" || session.role === "ADMIN_IHK") && user?.official?.officialType === "OBSERVER";
    const isSpecialCase = user?.official?.officialType === "Gözlemci" || session.role === "ADMIN"; 

    if (!isSuperAdmin && !isObserverAdmin) {
        if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
             redirect("/admin/bag");
        }
    }

    const standardCategories = [
        "Oyun", 
        "Saha ve Donanım", 
        "Takımlar", 
        "Oyun Düzenlemeleri", 
        "İhlaler", 
        "Fauller",
        "Genel Koşullar",
        "Hakemler, Masa Görevlileri, Komiser: Görevleri ve Yetkileri"
    ];

    let assignments: any[] = [];
    let categories: string[] = [...standardCategories];

    try {
        // Fetch existing assignments for the homework tab
        assignments = await db.examAssignment.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { id: true, username: true }
                },
                _count: {
                    select: { attempts: true }
                }
            }
        });

        // Fetch categories to populate dropdown options for assignments
        const rawCategories = await db.question.findMany({
            select: { category: true },
            distinct: ['category']
        });

        const dbCategories = rawCategories
            .map((q: any) => q.category)
            .filter(Boolean) as string[];

        categories = Array.from(new Set([...standardCategories, ...dbCategories]));
    } catch (e: any) {
        console.error("Database error while fetching questions/assignments:", e);
    }

    return <QuestionsHubClient initialAssignments={assignments} categories={categories} />;
}
