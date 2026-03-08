import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import ExamClient from "./ExamClient";
import { db } from "@/lib/db";

export default async function ExamPage() {
    const session = await verifySession();

    const role = (session.role || "").toUpperCase();
    const isAllowed = role === "REFEREE" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "OBSERVER" || role === "ADMIN_IHK";

    if (!isAllowed) {
        redirect("/");
    }

    // Get referee info
    const referee = await db.referee.findUnique({
        where: { userId: session.userId },
    });

    // If Admin/Observer doesn't have a referee profile, we can still show the client with a dummy/null ID
    // or handle it inside the client. For now, let's pass null if not a referee.
    return <ExamClient refereeId={referee?.id || 0} />;
}
