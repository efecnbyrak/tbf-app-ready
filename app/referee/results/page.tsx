import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import ResultsClient from "./ResultsClient";

export default async function ResultsPage() {
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

    return <ResultsClient refereeId={referee.id} />;
}
