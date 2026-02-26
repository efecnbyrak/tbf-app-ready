import { ResponsiveNav } from "./ResponsiveNav";
import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function RefereeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await verifySession();

    const referee = await db.referee.findUnique({
        where: { userId: session.userId }
    });

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row">
            <ResponsiveNav
                refereeName={referee?.firstName || "Kullanıcı"}
                roleType="REFEREE"
            />

            <main className="flex-1 md:pl-64 flex flex-col min-h-screen">
                <div className="flex-1 p-4 md:p-8 pt-16 md:pt-8 w-full">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>

                {/* Dashboard Footer */}
                <footer className="p-6 border-t border-zinc-200 dark:border-zinc-800 text-center text-zinc-500 text-xs mt-auto">
                    <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 italic font-medium">
                        <span>© {new Date().getFullYear()} Türkiye Basketbol Federasyonu</span>
                        <span className="hidden md:inline text-zinc-300 dark:text-zinc-700">|</span>
                        <Link href="/kvkk" target="_blank" className="hover:text-red-700 transition-colors uppercase tracking-widest text-[10px]">KVKK Aydınlatma Metni</Link>
                    </div>
                </footer>
            </main>
        </div>
    );
}
