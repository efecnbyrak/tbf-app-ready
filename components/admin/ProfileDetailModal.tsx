"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Calendar, LogIn, Trophy, UserSquare2, Phone, Mail, MapPin, Briefcase, Hash, Edit3, Save, RotateCcw, Shield, Star, AlertCircle, Check } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { updateRefereeProfile } from "@/app/actions/admin-users";
import { useRouter } from "next/navigation";

interface ProfileDetailModalProps {
    official: any;
    onClose: () => void;
    onToggleActive?: () => void;
}

const CLASSIFICATIONS = ["A", "B", "C", "IL_HAKEMI", "ADAY_HAKEM", "BELIRLENMEMIS"];
const OFFICIAL_TYPES = [
    { id: "REFEREE", label: "Hakem" },
    { id: "TABLE", label: "Masa Görevlisi" },
    { id: "OBSERVER", label: "Gözlemci" },
    { id: "STATISTICIAN", label: "İstatistikçi" },
    { id: "HEALTH", label: "Sağlık Görevlisi" },
    { id: "FIELD_COMMISSIONER", label: "Saha Komiseri" }
];

export function ProfileDetailModal({ official, onClose, onToggleActive }: ProfileDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Edit State
    const [editData, setEditData] = useState({
        classification: official.classification || "BELIRLENMEMIS",
        officialType: official.officialType || "REFEREE",
        points: official.points || 0,
        rating: official.rating || 0,
        suspendedUntil: official.user?.suspendedUntil ? new Date(official.user.suspendedUntil).toISOString().split('T')[0] : "",
        regionIds: official.regions?.map((r: any) => r.id) || []
    });

    const [availableRegions, setAvailableRegions] = useState<any[]>([]);

    useEffect(() => {
        // Fetch regions if editing
        if (isEditing) {
            fetch("/api/regions")
                .then(res => res.json())
                .then(data => setAvailableRegions(data))
                .catch(err => console.error("Region fetch failed:", err));
        }
    }, [isEditing]);

    if (!official) return null;

    const isActive = official.user?.isActive ?? true;
    const isSuspended = official.user?.suspendedUntil && new Date(official.user.suspendedUntil) > new Date();
    const createdAt = official.user?.createdAt ? new Date(official.user.createdAt) : null;
    const lastLoginAt = official.user?.lastLoginAt ? new Date(official.user.lastLoginAt) : null;

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateRefereeProfile(official.userId, {
                ...editData,
                suspendedUntil: editData.suspendedUntil ? new Date(editData.suspendedUntil) : null,
                points: Number(editData.points),
                rating: Number(editData.rating)
            });

            if (res.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                alert("Hata: " + res.message);
            }
        });
    };

    const toggleRegion = (id: number) => {
        setEditData(prev => ({
            ...prev,
            regionIds: prev.regionIds.includes(id)
                ? prev.regionIds.filter((rid: number) => rid !== id)
                : [...prev.regionIds, id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Simple Close & Edit Buttons */}
                <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2 rounded-lg transition-all ${isEditing
                            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-600"}`}
                        title={isEditing ? "İptal Et" : "Düzenle"}
                    >
                        {isEditing ? <RotateCcw className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 rounded-lg transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        {/* Profile Image - Simplified */}
                        <div className="w-32 h-32 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700 shrink-0 overflow-hidden shadow-inner">
                            {official.imageUrl ? (
                                <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                            ) : (
                                <img src="/hakem/defaultHakem.png" alt="Default Hakem" className="w-full h-full object-cover" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 truncate">
                                {official.firstName} {official.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {isEditing ? (
                                    <div className="flex gap-2 w-full">
                                        <select
                                            value={editData.officialType}
                                            onChange={(e) => setEditData({ ...editData, officialType: e.target.value })}
                                            className="flex-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg text-xs font-bold focus:ring-1 ring-red-500 outline-none"
                                        >
                                            {OFFICIAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <select
                                            value={editData.classification}
                                            onChange={(e) => setEditData({ ...editData, classification: e.target.value })}
                                            className="flex-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-lg text-xs font-bold focus:ring-1 ring-red-500 outline-none"
                                        >
                                            {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <span className="px-3 py-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                            {OFFICIAL_TYPES.find(t => t.id === official.officialType)?.label || "HAKEM"}
                                        </span>
                                        <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                            {official.classification?.replace('_', ' ') || "BELİRTİLMEMİŞ"}
                                        </span>
                                        {isSuspended && (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                                CEZALI
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>

                            {!isEditing && (
                                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                                    <div className="flex items-center gap-1.5">
                                        <Star className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
                                        <span className="text-zinc-900 dark:text-white font-bold">{official.points || 0} Puan</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Trophy className="w-3.5 h-3.5 text-zinc-400" />
                                        <span>{official._count?.assignments || 0} Görev</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Performance</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={editData.points}
                                            onChange={(e) => setEditData({ ...editData, points: Number(e.target.value) })}
                                            placeholder="Puan"
                                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 ring-red-500 outline-none text-sm"
                                        />
                                        <input
                                            type="number"
                                            value={editData.rating}
                                            onChange={(e) => setEditData({ ...editData, rating: Number(e.target.value) })}
                                            placeholder="Rating"
                                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 ring-red-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Ceza Bitiş Tarihi</label>
                                    <input
                                        type="date"
                                        value={editData.suspendedUntil}
                                        onChange={(e) => setEditData({ ...editData, suspendedUntil: e.target.value })}
                                        className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-1 ring-red-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Bölge Ayarları (Şehir)</label>
                                <div className="flex flex-wrap gap-2 p-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl min-h-[40px]">
                                    {availableRegions.map((region) => (
                                        <button
                                            key={region.id}
                                            onClick={() => toggleRegion(region.id)}
                                            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${editData.regionIds.includes(region.id)
                                                    ? "bg-red-600 text-white"
                                                    : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                                                }`}
                                        >
                                            {region.name}
                                        </button>
                                    ))}
                                    {availableRegions.length === 0 && <span className="text-[10px] text-zinc-400 italic">Yükleniyor...</span>}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-600/10"
                                >
                                    {isPending ? "GÜNCELLENİYOR..." : <><Save className="w-4 h-4" /> KAYDET</>}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                                >
                                    İPTAL
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">İletişim</p>
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> {official.phone}
                                        </p>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2 truncate">
                                            <Mail className="w-3 h-3" /> {official.email}
                                        </p>
                                    </div>
                                </div>
                                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Konum & Kariyer</p>
                                    <div className="space-y-1.5">
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                            <MapPin className="w-3 h-3" /> {official.regions?.map((r: any) => r.name).join(', ') || 'Belirtilmemiş'}
                                        </p>
                                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-2">
                                            <Briefcase className="w-3 h-3" /> {official.job || 'Belirtilmemiş'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-zinc-900 dark:bg-zinc-50 rounded-2xl shadow-xl">
                                <div>
                                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest leading-none">Hesap Durumu</p>
                                    <p className="text-xs font-bold text-white dark:text-zinc-900 mt-1">
                                        {isActive ? "AKTİF" : "ERİŞİM KISITLI"}
                                    </p>
                                </div>
                                <button
                                    onClick={onToggleActive}
                                    className={`px-6 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${isActive
                                        ? "bg-red-600 text-white hover:bg-red-700"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                        }`}
                                >
                                    {isActive ? "Pasife Al" : "Aktif Et"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
