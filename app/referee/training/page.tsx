import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import TrainingClient from "./TrainingClient";

export default async function TrainingPage() {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    if (session.role !== "REFEREE") {
        redirect("/");
    }

    return <TrainingClient />;
}
