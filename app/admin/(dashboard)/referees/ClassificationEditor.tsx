"use client";

import { useState } from "react";
import { updateRefereeClassification } from "@/app/actions/admin";
import { Loader2 } from "lucide-react";

interface ClassificationEditorProps {
    refereeId: number;
    currentClassification: string;
}

const CLASSIFICATIONS = [
    { value: "BELIRLENMEMIS", label: "Belirlenmemiş" },
    { value: "A", label: "A Klasmanı" },
    { value: "B", label: "B Klasmanı" },
    { value: "C", label: "C Klasmanı" },
    { value: "IL_HAKEMI", label: "İl Hakemi" },
    { value: "ADAY_HAKEM", label: "Aday Hakem" }
];

export function ClassificationEditor({ refereeId, currentClassification }: ClassificationEditorProps) {
    const [loading, setLoading] = useState(false);

    const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newValue = e.target.value;
        setLoading(true);
        try {
            await updateRefereeClassification(refereeId, newValue);
        } catch {
            alert("Güncelleme hatası");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <select
                defaultValue={currentClassification}
                onChange={handleChange}
                disabled={loading}
                className="text-xs border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-800"
            >
                {CLASSIFICATIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                ))}
            </select>
            {loading && <Loader2 className="w-3 h-3 animate-spin text-zinc-400" />}
        </div>
    );
}
