import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import ExamClient from "./ExamClient";

export default async function ExamPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "REFEREE") {
        redirect("/");
    }

    // Get referee info
    const referee = await db.referee.findUnique({
        where: { userId: session.userId },
    });

    if (!referee) {
        redirect("/");
    }

    return <ExamClient refereeId={referee.id} />;
}
