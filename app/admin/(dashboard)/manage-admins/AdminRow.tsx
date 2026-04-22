"use client";

import { ShieldCheck, User as UserIcon } from "lucide-react";
import { ProfileAvatarUploader } from "@/components/referee/ProfileAvatarUploader";
import { updateAdminAvatar } from "@/app/actions/admin-users";
import { useState } from "react";
import dynamic from "next/dynamic";

const ProfileDetailModal = dynamic(() => import("@/components/admin/ProfileDetailModal").then(mod => mod.ProfileDetailModal), {
    ssr: false
});

interface AdminRowProps {
    admin: any;
    isCurrentUser: boolean;
}

export function AdminRow({ admin, isCurrentUser }: AdminRowProps) {
    const isSuper = admin.role.name === "SUPER_ADMIN";
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Full name support
    const profile = admin.referee || admin.official;
    const displayName = profile ? `${profile.firstName} ${profile.lastName}` : admin.email || admin.username;
    const officialType = admin.referee ? "REFEREE" : (admin.official?.officialType || "REFEREE");

    return (
        <>
            <div
                onClick={() => profile && setIsModalOpen(true)}
                className={`group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all ${profile ? 'cursor-pointer hover:border-red-500' : ''}`}
            >
                {/* Row Layout */}
                <div className="flex items-center px-8 py-5">
                    <div className="flex-1 flex items-center gap-5">
                        <div className="flex-shrink-0" onClick={(e) => isCurrentUser && e.stopPropagation()}>
                            {isCurrentUser ? (
                                <ProfileAvatarUploader
                                    currentImageUrl={admin.imageUrl || profile?.imageUrl || null}
                                    userName={displayName}
                                    onUploadCompleteAction={updateAdminAvatar}
                                />
                            ) : (
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${isSuper
                                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 border-orange-100 dark:border-orange-800"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-700"
                                    }`}>
                                    {(admin.imageUrl || profile?.imageUrl) ? (
                                        <img src={admin.imageUrl || profile?.imageUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        isSuper ? <ShieldCheck className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />
                                    )}
                                </div>
                            )}
                        </div>
                        <div>
                            <div className="font-black text-xl text-zinc-900 dark:text-zinc-100 tracking-tighter uppercase italic flex items-center gap-2">
                                {displayName}
                                {isCurrentUser && (
                                    <span className="px-2 py-0.5 bg-zinc-900 text-white dark:bg-white dark:text-black text-[8px] font-black tracking-widest rounded-md not-italic">SEN</span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                    {admin.email || admin.username} • Kayıt: {new Date(admin.createdAt).toLocaleDateString('tr-TR')}
                                </div>
                                {profile && (
                                    <span className="text-[8px] font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded uppercase italic">Profil Düzenlenebilir</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:block">
                        <span className={`px-5 py-2 rounded-xl text-[10px] font-black tracking-[0.2em] italic uppercase ${isSuper
                            ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                            : "bg-zinc-900 text-white dark:bg-zinc-800"
                            }`}>
                            {isSuper ? "SÜPER YÖNETİCİ" : "YÖNETİCİ"}
                        </span>
                    </div>
                </div>
            </div>

            {isModalOpen && profile && (
                <ProfileDetailModal
                    official={{
                        ...profile,
                        user: admin,
                        officialType: officialType
                    }}
                    isSuperAdmin={true} // Usually only super admins access this page anyway
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}

