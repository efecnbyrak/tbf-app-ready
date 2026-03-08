export default function RefereeLoading() {
    return (
        <div className="animate-pulse flex flex-col gap-8 w-full">
            {/* Header Skeleton */}
            <div className="flex flex-col gap-2">
                <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>

            {/* Profile Card Skeleton */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-8 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row gap-8">
                <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-6">
                    <div className="space-y-3">
                        <div className="h-8 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                        <div className="h-4 w-1/4 bg-zinc-100 dark:bg-zinc-800 rounded" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" />
                                <div className="h-5 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Row Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="h-64 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800" />
                <div className="h-64 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800" />
            </div>
        </div>
    );
}
