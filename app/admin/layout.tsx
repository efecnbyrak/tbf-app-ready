
import { getSession } from "@/lib/session";
import { AdminLayoutClient } from "./AdminLayoutClient";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    // Secure the admin area
    if (!session || !["ADMIN", "SUPER_ADMIN", "ADMIN_IHK"].includes(session.role)) {
        redirect("/admin/login");
    }

    return <AdminLayoutClient role={session.role}>{children}</AdminLayoutClient>;
}
