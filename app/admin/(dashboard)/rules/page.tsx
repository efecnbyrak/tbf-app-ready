import { verifySession } from "@/lib/session";
import AdminRulesClient from "./AdminRulesClient";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
    await verifySession();

    return (
        <div>
            <AdminRulesClient />
        </div>
    );
}
