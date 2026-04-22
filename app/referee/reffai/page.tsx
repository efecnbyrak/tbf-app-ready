import { ReffAIChat } from "@/components/reffai/ReffAIChat";
import { Metadata } from "next";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata: Metadata = {
    title: "ReffAI - Hakem Destek Sistemi | BKS",
    description: "Basketbol kuralları ve hakemlik bilgileri için yapay zeka asistanınız.",
};

export default async function ReffAIPage() {
    const session = await verifySession();

    if (!session) {
        redirect("/referee");
    }

    const user = await db.user.findUnique({
        where: { id: Number(session.userId) },
        select: {
            referee: {
                select: { firstName: true, lastName: true }
            }
        }
    });

    const fullName = user?.referee ? `${user.referee.firstName} ${user.referee.lastName}`.trim() : "";
    const isSuperAdmin = session.role === "SUPER_ADMIN";

    // Yalnızca "Efe Can Bayrak" isimli Hakem veya Süper Admin bu sayfaya erişebilir.
    if (fullName !== "Efe Can Bayrak" && !isSuperAdmin) {
        redirect("/referee");
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                        ReffAI Asistan
                    </h1>
                    <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
                        BETA
                    </span>
                </div>
                <p className="text-sm text-zinc-500 font-medium italic">
                    FIBA kuralları ve TBF yönergeleri hakkında yapay zeka destekli soru-cevap.
                </p>
            </div>

            {/* Chat Container */}
            <div className="w-full max-w-5xl">
                <ReffAIChat />
            </div>
        </div>
    );
}
