import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomePage } from "@/components/HomePage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let redirectTo: string | null = null;

  try {
    // Check for existing session
    const session = await getSession();

    // If user is already logged in, redirect to their dashboard
    if (session?.userId) {
      const role = session.role;
      if (role === "SUPER_ADMIN" || role === "ADMIN_IHK" || role === "ADMIN") {
        redirectTo = "/admin";
      } else {
        // For all other roles, check the DB profile to determine the correct dashboard
        const user = await db.user.findUnique({
          where: { id: session.userId },
          select: { referee: { select: { id: true } }, official: { select: { id: true } } }
        });

        if (user?.official) {
          redirectTo = "/general";
        } else if (user?.referee) {
          redirectTo = "/referee";
        } else if (role === "REFEREE") {
          // Fallback for role name
          redirectTo = "/referee";
        }
      }
    }
  } catch (error) {
    if ((error as any)?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[PAGE] Root page error:", error);
  }

  if (redirectTo) {
    redirect(redirectTo);
  }

  // Final fallthrough: If not logged in or error occurred, show the login/register page
  return <HomePage />;
}
