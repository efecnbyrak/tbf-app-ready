"use client";

import { FileDown } from "lucide-react";

interface ExportButtonProps {
    group?: string;
    type?: string;
}

export function ExportButton({ group, type }: ExportButtonProps) {
    const handleExport = () => {
        const params = new URLSearchParams();
        if (group) params.set("group", group);
        if (type) params.set("type", type);
        // Navigate to the export route to trigger download
        window.location.href = `/admin/availability/export?${params.toString()}`;
    };

    return (
        <button
            onClick={handleExport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2"
        >
            <FileDown size={16} />
            Excel İndir
        </button>
    );
}
