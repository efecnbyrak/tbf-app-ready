import { redirect } from "next/navigation";

// Old admin login path now redirects to the hidden one
export default function AdminLoginRedirect() {
    redirect("/basket/admin/login");
}
