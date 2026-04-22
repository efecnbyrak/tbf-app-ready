import Image from "next/image";
import { db } from "@/lib/db";
import { formatClassification, formatIBAN } from "@/lib/format-utils";
import { PenaltyBadge } from "@/components/referee/PenaltyBadge";
import { ProfileSettings } from "@/components/referee/ProfileSettings";
import { ProfileAvatarUploader } from "@/components/referee/ProfileAvatarUploader";
import { updateUserAvatar } from "@/app/actions/referee";

export async function RefereeProfileSection({ userId }: { userId: number }) {
    let sourceData: any = await db.referee.findUnique({
        where: { userId },
        include: {
            regions: true,
            user: {
                include: {
                    penalties: true
                }
            }
        }
    });

    let isOfficial = false;

    if (!sourceData) {
        sourceData = await db.generalOfficial.findUnique({
            where: { userId },
            include: {
                regions: true,
                user: {
                    include: {
                        penalties: true
                    }
                }
            }
        });
        isOfficial = true;
    }

    if (!sourceData) return <div>Profil bulunamadı.</div>;

    const hasPenalties = sourceData.user.penalties.length > 0;
    const displayName = `${sourceData.firstName} ${sourceData.lastName}`;

    let roleLabel = "";
    if (!isOfficial) {
        roleLabel = formatClassification(sourceData.classification);
    } else {
        const typeLabels: Record<string, string> = {
            "TABLE": "Masa Görevlisi",
            "OBSERVER": "Gözlemci",
            "HEALTH": "Sağlıkçı",
            "STATISTICIAN": "İstatistikçi",
            "FIELD_COMMISSIONER": "Saha Komiseri",
            "TABLE_STATISTICIAN": "Masa & İstatistik",
            "TABLE_HEALTH": "Masa & Sağlık",
            "REFEREE": "Hakem"
        };
        roleLabel = typeLabels[sourceData.officialType] || sourceData.officialType || "Görevli";
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-start gap-6">
            <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex-shrink-0">
                        <ProfileAvatarUploader
                            currentImageUrl={sourceData.imageUrl || null}
                            userName={displayName}
                            onUploadCompleteAction={updateUserAvatar}
                        />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{displayName}</h2>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className={`inline-flex items-center justify-center h-6 px-3 rounded-full text-[11px] uppercase tracking-wide font-bold leading-none ${!isOfficial && sourceData.classification === 'BELIRLENMEMIS'
                                ? 'bg-zinc-100 text-zinc-600'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {roleLabel}
                            </span>
                            <PenaltyBadge hasPenalties={hasPenalties} />
                        </div>
                    </div>
                </div>

                <ProfileSettings
                    currentEmail={sourceData.email}
                    currentPhone={sourceData.phone}
                    currentAddress={sourceData.address || ""}
                    currentIban={sourceData.iban || ""}
                    currentSecurityQuestion={sourceData.user.securityQuestion || ""}
                    currentSecurityAnswer={sourceData.user.securityAnswer || ""}
                />
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">


                <div>
                    <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">E-posta</label>
                    <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full truncate border border-zinc-100 dark:border-zinc-700/50">
                        {sourceData.email}
                    </span>
                </div>

                {sourceData.phone && (
                    <div>
                        <label className="text-xs font-medium text-zinc-500 uppercase block mb-1">Telefon</label>
                        <span className="text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-1.5 rounded-lg block w-full border border-zinc-100 dark:border-zinc-700/50">
                            {sourceData.phone}
                        </span>
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">IBAN</label>
                    <span className="font-mono text-zinc-900 dark:text-white bg-white dark:bg-zinc-800/50 px-3 py-2 rounded-lg block w-full border-2 border-zinc-100 dark:border-zinc-700 overflow-hidden truncate shadow-sm">
                        {sourceData.iban ? formatIBAN(sourceData.iban) : "BELİRTİLMEMİŞ"}
                    </span>
                </div>

                <div>
                    <label className="text-xs font-bold text-red-500 uppercase block mb-1 flex items-center gap-1">
                        Kurtarma Kodu
                    </label>
                    <span className="font-mono text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg block w-full border-2 border-red-100 dark:border-red-900/30 overflow-hidden truncate shadow-sm tracking-widest font-black text-center">
                        {sourceData.user.recoveryCode || "OLUŞTURULMADI"}
                    </span>
                </div>
            </div>
        </div>
    );
}
