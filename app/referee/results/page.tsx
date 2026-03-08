import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import ResultsClient from "./ResultsClient";

export default async function ResultsPage() {
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

    // If no referee profile (e.g. Admin), show results client with 0 to show empty state or handle inside
    return <ResultsClient refereeId={referee?.id || 0} />;
}
