import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import ExamClient from "../../referee/exam/ExamClient";
import { db } from "@/lib/db";

export default async function GeneralExamPage({ searchParams }: { searchParams: { aid?: string } }) {
    const session = await verifySession();
    const assignmentId = searchParams.aid ? parseInt(searchParams.aid) : undefined;

    const role = (session.role || "").toUpperCase();
    // Allow Officials, Admins, etc.
    const isAllowed = role === "OFFICIAL" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "OBSERVER";

    if (!isAllowed) {
        redirect("/");
    }

    // Get official info
    const official = await db.generalOfficial.findUnique({
        where: { userId: session.userId },
    });

    // We also check referee if it's not an official (though unlikely in this route)
    let profileId = official?.id || 0;
    if (!profileId) {
        const referee = await db.referee.findFirst({
            where: { userId: session.userId }
        });
        profileId = referee?.id || 0;
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
