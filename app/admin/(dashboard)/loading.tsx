import { BarChart3, Users, FileText, CheckCircle } from "lucide-react";

export default function AdminLoading() {
    return (
        <div className="animate-pulse">
            <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg mb-8" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                        <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                            <div className="h-8 w-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                    <div className="space-y-2">
                        <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                        <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    </div>
                </div>
                <div className="h-[400px] w-full bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800" />
            </div>

            <div className="mt-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 h-64" />
        </div>
    );
}
