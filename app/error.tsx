'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log to external system (Sentry, Axiom, or local logger)
        console.error("Global UI Crash Blocked:", error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center p-12 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-black text-red-700 uppercase italic">Bir şeyler ters gitti!</h2>
            <p className="text-sm text-red-600/80 mb-6 font-medium">İşleminiz gerçekleştirilirken kısmi bir hata oluştu.</p>
            <button
                onClick={() => reset()}
                className="flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700"
            >
                <RefreshCcw className="w-4 h-4" /> Yeniden Dene
            </button>
        </div>
    );
}
