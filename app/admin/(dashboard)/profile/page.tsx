import { ArrowRight, Clock } from "lucide-react";
import { verifySession } from "@/lib/session";
import { Suspense } from "react";
import { RefereeProfileSection } from "@/app/referee/components/RefereeProfileSection";
import { RefereeAvailabilitySection } from "@/app/referee/components/RefereeAvailabilitySection";
import Link from "next/link";

function SectionLoading({ height = "h-32" }: { height?: string }) {
    return <div className={`w-full ${height} bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-xl`} />;
}

export default async function AdminProfilePage() {
    const session = await verifySession();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <header>
                <h1 className="text-3xl font-black text-zinc-900 dark:text-white uppercase italic underline decoration-red-600 decoration-4">Kişisel Profilim</h1>
                <p className="text-zinc-500 font-bold uppercase italic text-xs tracking-widest mt-2">Güncel Durumun ve Bildirimlerin</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-8">
                    <Suspense fallback={<SectionLoading height="h-64" />}>
                        <RefereeProfileSection userId={session.userId} />
                    </Suspense>
                </div>

                <div className="space-y-6">
                    <div className="bg-red-700 text-white rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:shadow-2xl transition-all h-full max-h-[350px] min-h-[250px] border-2 border-red-500/20">
                        <div className="absolute right-[-30px] top-[-30px] opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform">
                            <Clock size={150} />
                        </div>

                        <div>
                            <h3 className="text-xl font-black mb-2 uppercase italic tracking-tight">Uygunluk Bildirimi</h3>
                            <p className="text-red-100 text-sm font-medium opacity-90 italic">Gelecek haftanın maç programı için durumunu bildir.</p>
                        </div>

                        <Link href="/admin/availability" prefetch={false} className="mt-8 flex items-center justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-6 py-4 hover:bg-white/20 transition-all group/btn">
                            <span className="font-black text-xs tracking-[0.2em] uppercase italic">FORMU DOLDUR</span>
                            <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
