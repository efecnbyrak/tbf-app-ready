import { verifySession } from "@/lib/session";
import AdminRulesClient from "./AdminRulesClient";
import RulesAIAssistant from "./RulesAIAssistant";

export const dynamic = "force-dynamic";

export default async function AdminRulesPage() {
    const session = await verifySession();
    const isSuperAdmin = session.role === "SUPER_ADMIN";

    return (
        <div>
            <AdminRulesClient />
            {isSuperAdmin && <RulesAIAssistant />}
        </div>
    );
}
