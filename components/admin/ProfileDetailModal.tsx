"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Calendar, LogIn, Trophy, UserSquare2, Phone, Mail, MapPin, Briefcase, Hash, Edit3, Save, RotateCcw, Shield, Star, AlertCircle, Check, Search } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { updateRefereeProfile } from "@/app/actions/admin-users";
import { useRouter } from "next/navigation";
import { TURKEY_CITIES, OFFICIAL_TYPES, CLASSIFICATIONS } from "@/lib/constants";

interface ProfileDetailModalProps {
    official: any;
    onClose: () => void;
    onToggleActive?: () => void;
}

export function ProfileDetailModal({ official, onClose, onToggleActive }: ProfileDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Inline edit state
    const [editingField, setEditingField] = useState<string | null>(null);

    // Edit State
    const [editData, setEditData] = useState({
        classification: official.classification || "BELIRLENMEMIS",
        officialType: official.officialType || "REFEREE",
        suspendedUntil: official.user?.suspendedUntil ? new Date(official.user.suspendedUntil).toISOString().split('T')[0] : "",
        regionIds: official.regions?.map((r: any) => r.id) || []
    });

    const [availableRegions, setAvailableRegions] = useState<any[]>([]);
    const [citySearch, setCitySearch] = useState("");

    useEffect(() => {
        fetch("/api/regions")
            .then(res => res.json())
            .then(data => setAvailableRegions(data))
            .catch(err => console.error("Region fetch failed:", err));
    }, []);

    if (!official) return null;

    const isActive = official.user?.isActive ?? true;
    const isSuspended = official.user?.suspendedUntil && new Date(official.user.suspendedUntil) > new Date();

    // Check if it's a referee or general official for UI logic
    const isReferee = official.officialType === "REFEREE";

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateRefereeProfile(official.userId, {
                ...editData,
                suspendedUntil: editData.suspendedUntil ? new Date(editData.suspendedUntil) : null,
                // These are removed from UI but kept in API/DB for future
                points: official.points,
                rating: official.rating
            });

            if (res.success) {
                setIsEditing(false);
                setEditingField(null);
                router.refresh();
            } else {
                alert("Hata: " + res.message);
            }
        });
    };

    const toggleRegion = (id: number) => {
        setEditData(prev => ({
            ...prev,
            regionIds: [id] // Force single region as requested (select/dropdown behavior)
        }));
        setEditingField(null);
    };

    const selectedRegionName = availableRegions.find(r => editData.regionIds.includes(r.id))?.name || "Belirtilmemiş";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header Actions */}
                <div className="absolute top-6 right-6 flex gap-2 z-20">
                    {isEditing || editingField ? (
                        <button
                            onClick={handleSave}
                            disabled={isPending}
                            className="p-2.5 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50"
                        >
                            {isPending ? <RotateCcw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        </button>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-red-600 rounded-2xl transition-all"
                        >
                            <Edit3 className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 rounded-2xl transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 sm:p-10">
                    {/* User Info Section */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-[2rem] bg-zinc-50 dark:bg-zinc-800 border-4 border-white dark:border-zinc-800 shadow-xl overflow-hidden mb-4 relative">
                            {official.imageUrl ? (
                                <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                            ) : (
                                <img src="/hakem/defaultHakem.png" alt="Default Hakem" className="w-full h-full object-cover" />
                            )}
                            {isSuspended && (
                                <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg">CEZALI</span>
                                </div>
                            )}
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white leading-tight uppercase tracking-tight">
                            {official.firstName} {official.lastName}
                        </h2>

                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            {/* Inline Edit: Official Type */}
                            {editingField === 'type' ? (
                                <select
                                    autoFocus
                                    value={editData.officialType}
                                    onChange={(e) => { setEditData({ ...editData, officialType: e.target.value }); setEditingField(null); }}
                                    onBlur={() => setEditingField(null)}
                                    className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold border-2 border-red-500 outline-none"
                                >
                                    {OFFICIAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            ) : (
                                <button
                                    onClick={() => setEditingField('type')}
                                    className="px-4 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-black rounded-xl uppercase tracking-widest hover:scale-105 transition-transform"
                                >
                                    {OFFICIAL_TYPES.find(t => t.id === editData.officialType)?.label || "HAKEM"}
                                </button>
                            )}

                            {/* Inline Edit: Classification */}
                            {editingField === 'class' ? (
                                <select
                                    autoFocus
                                    value={editData.classification}
                                    onChange={(e) => { setEditData({ ...editData, classification: e.target.value }); setEditingField(null); }}
                                    onBlur={() => setEditingField(null)}
                                    className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-bold border-2 border-red-500 outline-none"
                                >
                                    {CLASSIFICATIONS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                </select>
                            ) : (
                                <button
                                    onClick={() => setEditingField('class')}
                                    className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:scale-105 transition-transform"
                                >
                                    {CLASSIFICATIONS.find(c => c.id === editData.classification)?.label || "BELİRTİLMEMİŞ"}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-4">
                        {/* Status Label (Suspension) */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">İletişim Bilgileri</label>
                                <div className="space-y-3">
                                    <a href={`tel:${official.phone}`} className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-red-600 transition-colors">
                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm"><Phone className="w-4 h-4" /></div>
                                        {official.phone}
                                    </a>
                                    <a href={`mailto:${official.email}`} className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-200 hover:text-red-600 transition-colors truncate">
                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm"><Mail className="w-4 h-4" /></div>
                                        {official.email}
                                    </a>
                                </div>
                            </div>

                            <div className="w-full sm:w-[40%] p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">Bölge (Şehir)</label>
                                {editingField === 'region' ? (
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Search className="w-4 h-4 text-zinc-400" />
                                        </div>
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Ara..."
                                            value={citySearch}
                                            onChange={(e) => setCitySearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 rounded-xl text-xs font-bold border-2 border-red-500 outline-none"
                                        />
                                        <div className="absolute top-full left-0 w-full mt-2 max-h-40 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50">
                                            {availableRegions
                                                .filter(r => r.name.toLowerCase().includes(citySearch.toLowerCase()))
                                                .map(r => (
                                                    <button
                                                        key={r.id}
                                                        onClick={() => toggleRegion(r.id)}
                                                        className="w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                                                    >
                                                        {r.name}
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setEditingField('region')}
                                        className="flex items-center gap-3 text-sm font-black text-zinc-900 dark:text-white"
                                    >
                                        <div className="p-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm"><MapPin className="w-4 h-4 text-red-600" /></div>
                                        {selectedRegionName}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Suspension Logic */}
                        <div className="p-5 bg-zinc-50 dark:bg-zinc-800/50 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block">Biri Ceza Tarihi (Varsa)</label>
                            <input
                                type="date"
                                value={editData.suspendedUntil}
                                onChange={(e) => setEditData({ ...editData, suspendedUntil: e.target.value })}
                                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 rounded-2xl text-sm font-bold border-2 border-transparent focus:border-red-500 outline-none transition-all shadow-sm"
                            />
                        </div>

                        {/* Account Visibility Toggle */}
                        <div className="flex items-center justify-between p-6 bg-zinc-900 dark:bg-zinc-100 rounded-[2rem] shadow-xl mt-6">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Sistem Durumu</span>
                                <span className="text-sm font-black text-white dark:text-zinc-900 mt-1">
                                    {isActive ? "AKTİF" : "DONDURULMUŞ"}
                                </span>
                            </div>
                            <button
                                onClick={onToggleActive}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isActive
                                    ? "bg-red-600 text-white shadow-red-600/30 hover:bg-red-700 hover:shadow-red-700/40"
                                    : "bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-700 hover:shadow-emerald-700/40"
                                    }`}
                            >
                                {isActive ? "PASİFE AL" : "AKTİFLEŞTİR"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
