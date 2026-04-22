import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { verifySession } from "@/lib/session";
import { Suspense } from "react";
import { RefereeProfileSection } from "../components/RefereeProfileSection";
import { RefereeAvailabilitySection } from "../components/RefereeAvailabilitySection";

function SectionLoading({ height = "h-32" }: { height?: string }) {
    return <div className={`w-full ${height} bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl`} />;
}

export default async function RefereeProfileDashboard() {
    const session = await verifySession();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Profilim</h1>
                <p className="text-zinc-500 mt-2">Güncel durumun ve bildirimlerin</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content Column */}
                <div className="md:col-span-2 space-y-8">

                    {/* Profile Card Section */}
                    <Suspense fallback={<SectionLoading height="h-64" />}>
                        <RefereeProfileSection userId={session.userId} />
                    </Suspense>
                </div>

                {/* Right Sidebar: Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-red-700 text-white rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group hover:shadow-xl transition-all h-full max-h-[300px] min-h-[200px]">
                        <div className="absolute right-[-20px] top-[-20px] opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform">
                            <Clock size={120} />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-1">Uygunluk Bildirimi</h3>
                            <p className="text-red-100 text-sm opacity-90">Maç programı için durumunu bildir.</p>
                        </div>

                        <Link href="/referee/availability" prefetch={false} className="mt-6 flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 hover:bg-white/30 transition-colors">
                            <span className="font-semibold">Bildirim Yap</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
