"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { clearAuditLogs } from "@/app/actions/logs";
import { useRouter } from "next/navigation";

export function LogsClient() {
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleClear = async () => {
        if (!confirm("Tüm sistem kayıtlarını kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
            return;
        }

        setIsPending(true);
        try {
            const res = await clearAuditLogs();
            if (res.success) {
                alert(res.message);
                router.refresh();
            } else {
                alert(res.message);
            }
        } catch (error: any) {
            alert("Bir hata oluştu: " + error.message);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <button
            onClick={handleClear}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-300 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-700 transition-all text-xs font-black uppercase italic tracking-wider disabled:opacity-50"
        >
            <Trash2 className="w-4 h-4" />
            {isPending ? "Temizleniyor..." : "Tümünü Temizle"}
        </button>
    );
}
