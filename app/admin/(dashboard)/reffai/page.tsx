import { ReffAIChat } from "@/components/reffai/ReffAIChat";
import { ReffAIUpload } from "@/components/reffai/ReffAIUpload";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "ReffAI - Hakem Destek Sistemi | Yönetim",
    description: "Basketbol kuralları ve hakemlik bilgileri için yapay zeka asistanınız.",
};

export default function ReffAIAdminPage() {
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
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-widest border border-emerald-200 dark:border-emerald-800">
                        DOKÜMAN YÖNETİMİ
                    </span>
                </div>
                <p className="text-sm text-zinc-500 font-medium italic">
                    FIBA kuralları ve TBF yönergeleri hakkında yapay zeka destekli soru-cevap.
                </p>
            </div>

            {/* Chat Container */}
            <div className="w-full max-w-5xl">
                <ReffAIUpload />
                <ReffAIChat />
            </div>
        </div>
    );
}
