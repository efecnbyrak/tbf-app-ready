
"use client";

import { Referee } from "@prisma/client"; // Or wherever types are
import Image from "next/image";
import { User, Shield, Activity, Save, Table, FileSpreadsheet } from "lucide-react";
import { DeleteRefereeButton } from "@/app/admin/(dashboard)/referees/DeleteRefereeButton";
import { ClassificationEditor } from "@/app/admin/(dashboard)/referees/ClassificationEditor";

import { TypeEditor } from "@/components/admin/TypeEditor";
import { SuspendRefereeButton } from "@/components/admin/SuspendRefereeButton";

// Icon mapping based on officialType
const RoleIcon = ({ type }: { type: string }) => {
    switch (type) {
        case "REFEREE": return <User className="w-4 h-4 text-red-600" />;
        case "TABLE": return <Table className="w-4 h-4 text-orange-600" />;
        case "OBSERVER": return <Shield className="w-4 h-4 text-blue-600" />;
        case "HEALTH": return <Activity className="w-4 h-4 text-green-600" />;
        case "STATISTICIAN": return <FileSpreadsheet className="w-4 h-4 text-purple-600" />;
        case "FIELD_COMMISSIONER": return <Shield className="w-4 h-4 text-amber-600" />;
        case "TABLE_HEALTH": return <Activity className="w-4 h-4 text-cyan-600" />;
        case "TABLE_STATISTICIAN": return <FileSpreadsheet className="w-4 h-4 text-indigo-600" />;
        default: return <User className="w-4 h-4 text-zinc-500" />;
    }
};

interface OfficialCardProps {
    official: any; // Using any for now to avoid deep type issues with Prisma include, or refine type
}

export function OfficialCard({ official }: OfficialCardProps) {
    // Placeholder logic
    // TODO: Update image source to pull from specific folders based on ID or Name
    // Example: /hakem/${official.id}.jpg or /genel/${official.id}.jpg
    const placeholder = "/hakem/defaultHakem.png";
    const imageSrc = official.imageUrl || placeholder;

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col items-center p-4 text-center">
            {/* Photo */}
            <div className="w-24 h-24 relative rounded-full overflow-hidden mb-3 border-2 border-zinc-100 dark:border-zinc-800">
                <Image
                    src={imageSrc}
                    alt={`${official.firstName} ${official.lastName}`}
                    fill
                    className="object-cover"
                />
            </div>

            {/* Name */}
            <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-2 truncate w-full">
                {official.firstName} {official.lastName}
            </h3>

            {/* Editors: Type & Classification */}
            <div className="w-full space-y-2 mb-4">
                <div className="flex items-center justify-center gap-2">
                    <RoleIcon type={official.officialType} />
                    <TypeEditor refereeId={official.id} currentType={official.officialType} />
                </div>

                <div className="flex justify-center">
                    {official.officialType === 'REFEREE' && (
                        <ClassificationEditor
                            refereeId={official.id}
                            currentClassification={official.classification}
                        />
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="w-full mt-auto pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-1.5">
                    <DeleteRefereeButton refereeId={official.id} />
                    <SuspendRefereeButton userId={official.userId} suspendedUntil={official.user?.suspendedUntil} />
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                    {official.tckn ? `${official.tckn.substring(0, 2)}*******${official.tckn.substring(9, 11)}` : ''}
                </span>
            </div>
        </div>
    );
}
