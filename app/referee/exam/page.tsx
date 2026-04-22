import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import ExamClient from "./ExamClient";
import { db } from "@/lib/db";

export default async function ExamPage({ searchParams }: { searchParams: { aid?: string } }) {
    const session = await verifySession();
    const assignmentId = searchParams.aid ? parseInt(searchParams.aid) : undefined;

    const role = (session.role || "").toUpperCase();
    const isAllowed = role === "REFEREE" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "OBSERVER" || role === "ADMIN_IHK";

    if (!isAllowed) {
        redirect("/");
    }

    // Get referee/official info
    const referee = await db.referee.findUnique({
        where: { userId: session.userId },
    });

    // We also check general official if it's not a referee
    let profileId = referee?.id || 0;
    if (!profileId) {
        const official = await db.generalOfficial.findFirst({
            where: { userId: session.userId }
        });
        profileId = official?.id || 0;
    }

    let assignmentData = null;
    if (assignmentId) {
        assignmentData = await db.examAssignment.findUnique({
            where: { id: assignmentId }
        });
    }

    return (
        <ExamClient
            refereeId={profileId}
            assignmentId={assignmentId}
            assignmentTitle={assignmentData?.title}
            initialQuestionCount={assignmentData?.questionCount}
        />
    );
}
