import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                <p className="text-zinc-500 font-medium animate-pulse">Yükleniyor...</p>
            </div>
        </div>
    );
}
