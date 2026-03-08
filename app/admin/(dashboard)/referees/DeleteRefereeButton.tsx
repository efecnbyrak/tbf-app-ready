"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteReferee } from "@/app/actions/admin";

interface DeleteRefereeButtonProps {
    refereeId: number;
}

export function DeleteRefereeButton({ refereeId }: DeleteRefereeButtonProps) {
    const [status, setStatus] = useState<"idle" | "confirm" | "deleting">("idle");

    const handleClick = async () => {
        if (status === "idle") {
            setStatus("confirm");
            // Auto revert after 3 seconds if not confirmed
            setTimeout(() => {
                setStatus((prev) => prev === "confirm" ? "idle" : prev);
            }, 3000);
            return;
        }

        if (status === "confirm") {
            setStatus("deleting");
            const result = await deleteReferee(refereeId);
            if (result.error) {
                alert(result.error);
                setStatus("idle");
            } else {
                // Success, row will disappear via revalidate
                setStatus("idle");
            }
        }
    };

    if (status === "confirm") {
        return (
            <button
                onClick={handleClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 transition-colors text-xs font-bold animate-pulse"
            >
                <AlertTriangle size={14} />
                Emin misin?
            </button>
        );
    }

    if (status === "deleting") {
        return (
            <button disabled className="px-3 py-1.5 rounded bg-zinc-100 text-zinc-400 text-xs font-medium cursor-not-allowed">
                Siliniyor...
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors text-xs font-medium"
        >
            <Trash2 size={14} />
            Sil
        </button>
    );
}
