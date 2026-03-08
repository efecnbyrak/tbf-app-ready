"use client";

import { useState } from "react";
import { ShieldCheck, XCircle } from "lucide-react";
import { PenaltyModal } from "./PenaltyModal";

interface PenaltyBadgeProps {
    hasPenalties: boolean;
}

export function PenaltyBadge({ hasPenalties }: PenaltyBadgeProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className={`flex items-center justify-center p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 shadow-sm ${hasPenalties
                    ? "bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                    }`}
            >
                {hasPenalties ? (
                    <XCircle size={18} />
                ) : (
                    <ShieldCheck size={18} />
                )}
            </button>

            <PenaltyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
