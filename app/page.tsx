import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { HomePage } from "@/components/HomePage";

export const dynamic = "force-dynamic";

export default async function Home() {
  let redirectTo: string | null = null;

  try {
    // Check for existing session
    const session = await getSession();

    // If user is already logged in, redirect to their dashboard
    if (session?.userId) {
      const role = session.role;
      if (role === "ADMIN" || role === "SUPER_ADMIN" || role === "ADMIN_IHK") {
        redirectTo = "/admin";
      } else if (role === "REFEREE") {
        redirectTo = "/referee";
      }
    }
  } catch (error) {
    if ((error as any)?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[PAGE] Root page error:", error);
  }

  if (redirectTo) {
    try {
      redirect(redirectTo);
    } catch (redirectError) {
      if ((redirectError as any)?.digest?.includes("NEXT_REDIRECT")) {
        throw redirectError;
      }
      console.error("[PAGE] Final redirect error:", redirectError);
    }
  }

  // If not logged in or error occurred, show the login/register page
  return <HomePage />;
}
