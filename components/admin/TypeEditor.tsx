
"use client";

import { useState } from "react";
import { updateRefereeType } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface TypeEditorProps {
    refereeId: number;
    currentType: string;
}

const TYPES = [
    { value: "REFEREE", label: "Hakem" },
    { value: "TABLE", label: "Masa Görevlisi" },
    { value: "OBSERVER", label: "Gözlemci" },
    { value: "STATISTICIAN", label: "İstatistik Görevlisi" },
    { value: "HEALTH", label: "Sağlık Görevlisi" },
    { value: "FIELD_COMMISSIONER", label: "Saha Komiseri" },
    { value: "TABLE_HEALTH", label: "Masa & Sağlık" },
    { value: "TABLE_STATISTICIAN", label: "Masa & İstatistik" }
];

export function TypeEditor({ refereeId, currentType }: TypeEditorProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setLoading(true);
        try {
            await updateRefereeType(refereeId, newValue);
            router.refresh();
        } catch {
            alert("Güncelleme hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <select
                value={currentType}
                onChange={handleChange}
                disabled={loading}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-red-600 outline-none"
            >
                {TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                ))}
            </select>
            {loading && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
        </div>
    );
}
