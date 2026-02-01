import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomePage } from "@/components/HomePage";

export default async function Home() {
  // Check for existing session
  const session = await getSession();

  // If user is already logged in, redirect to their dashboard
  if (session?.userId) {
    if (session.role === "ADMIN") {
      redirect("/admin");
    } else if (session.role === "REFEREE") {
      redirect("/referee");
    }
  }

  // If not logged in, show the login/register page
  return <HomePage />;
}
