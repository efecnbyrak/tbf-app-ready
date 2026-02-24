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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Basketball Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none dark:invert" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0ZM30 5C35.0664 5 39.7719 6.55173 43.6826 9.17285C40.1706 13.4009 38 18.9103 38 25C38 31.0897 40.1706 36.5991 43.6826 40.8271C39.7719 43.4483 35.0664 45 30 45C24.9336 45 20.2281 43.4483 16.3174 40.8271C19.8294 36.5991 22 31.0897 22 25C22 18.9103 19.8294 13.4009 16.3174 9.17285C20.2281 6.55173 24.9336 5 30 5Z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

                {/* Close & Edit Buttons */}
                <div className="absolute top-6 right-6 flex gap-2 z-20">
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-2.5 rounded-full transition-all shadow-lg ${isEditing
                            ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                            : "bg-white dark:bg-zinc-800 text-zinc-500 hover:text-red-600"}`}
                    >
                        {isEditing ? <RotateCcw className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2.5 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 rounded-full transition-all shadow-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Header / Cover */}
                <div className="h-40 bg-zinc-900 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 opacity-90" />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                </div>

                <div className="px-8 pb-10 -mt-20 relative">
                    <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
                        {/* Avatar */}
                        <div className="w-40 h-40 rounded-[2.5rem] bg-white dark:bg-zinc-900 p-2.5 shadow-2xl border-[6px] border-white dark:border-zinc-900 relative group">
                            <div className="w-full h-full rounded-[1.8rem] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {official.imageUrl ? (
                                    <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <img src="/basketball_placeholder.png" alt="Placeholder" className="w-full h-full object-cover opacity-60 dark:invert grayscale" />
                                )}
                            </div>
                            {/* Score/Points Badge */}
                            {!isEditing && (
                                <div className="absolute -bottom-2 -right-2 px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-2xl shadow-xl font-black italic text-sm tracking-tighter flex items-center gap-1.5 border-4 border-white dark:border-zinc-900">
                                    <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                                    {official.points || 0} PN
                                </div>
                            )}
                        </div>

                        <div className="flex-1 pb-2">
                            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic leading-none mb-3">
                                {official.firstName} {official.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                {isEditing ? (
                                    <>
                                        <select
                                            value={editData.officialType}
                                            onChange={(e) => setEditData({ ...editData, officialType: e.target.value })}
                                            className="px-4 py-1.5 bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl text-xs font-black uppercase tracking-tight focus:ring-2 ring-red-500 outline-none"
                                        >
                                            {OFFICIAL_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                        </select>
                                        <select
                                            value={editData.classification}
                                            onChange={(e) => setEditData({ ...editData, classification: e.target.value })}
                                            className="px-4 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-none rounded-xl text-xs font-black uppercase tracking-tight focus:ring-2 ring-red-500 outline-none"
                                        >
                                            {CLASSIFICATIONS.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                                        </select>
                                    </>
                                ) : (
                                    <>
                                        <span className="px-4 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-2">
                                            <Shield className="w-3 h-3" />
                                            {OFFICIAL_TYPES.find(t => t.id === official.officialType)?.label || "HAKEM"}
                                        </span>
                                        <span className="px-4 py-1.5 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest italic shadow-lg shadow-red-600/20">
                                            {official.classification?.replace('_', ' ') || "BELİRTİLMEMİŞ"}
                                        </span>
                                        {isSuspended && (
                                            <span className="px-4 py-1.5 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-1.5 border border-orange-200 dark:border-orange-800">
                                                <AlertCircle className="w-3 h-3" />
                                                CEZALI
                                            </span>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-zinc-50 dark:bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 mb-8 animate-in slide-in-from-top-4 duration-500 max-h-[50vh] overflow-y-auto custom-scrollbar">
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block px-1">Puan Sistemi (PN/RT)</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="number"
                                            value={editData.points}
                                            onChange={(e) => setEditData({ ...editData, points: Number(e.target.value) })}
                                            placeholder="Puan"
                                            className="w-full px-5 py-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 ring-red-500 outline-none font-bold"
                                        />
                                        <input
                                            type="number"
                                            value={editData.rating}
                                            onChange={(e) => setEditData({ ...editData, rating: Number(e.target.value) })}
                                            placeholder="Rating %"
                                            className="w-full px-5 py-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 ring-red-500 outline-none font-bold"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block px-1">Görev Engeli (Ceza Bitiş)</label>
                                    <input
                                        type="date"
                                        value={editData.suspendedUntil}
                                        onChange={(e) => setEditData({ ...editData, suspendedUntil: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 focus:ring-2 ring-red-500 outline-none font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3 block px-1 truncate">Bölge Transfer (Merkez Değiştir)</label>
                                    <div className="grid grid-cols-2 gap-2 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 max-h-40 overflow-y-auto">
                                        {availableRegions.map((region) => (
                                            <button
                                                key={region.id}
                                                onClick={() => toggleRegion(region.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${editData.regionIds.includes(region.id)
                                                        ? "bg-red-500 text-white"
                                                        : "bg-zinc-50 dark:bg-zinc-800 text-zinc-500"
                                                    }`}
                                            >
                                                <span className="truncate">{region.name}</span>
                                                {editData.regionIds.includes(region.id) && <Check className="w-3 h-3 ml-2 shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col justify-end gap-3 h-full">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending}
                                    className="w-full py-4.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {isPending ? "GÜNCELLENİYOR..." : <><Save className="w-5 h-5" /> KAYDET VE AKTAR</>}
                                </button>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="w-full py-4 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all font-bold"
                                >
                                    DEĞİŞİKLİKLERİ İPTAL ET
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800 hover:border-red-100 dark:hover:border-red-900/30 transition-all group">
                                <div className="flex items-center gap-3 mb-2">
                                    <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Rating</span>
                                </div>
                                <p className="text-xl font-black text-zinc-900 dark:text-white italic">%{official.rating || 0}</p>
                            </div>
                            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Trophy className="w-4 h-4 text-red-600" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Görevler</span>
                                </div>
                                <p className="text-xl font-black text-zinc-900 dark:text-white italic">{official._count?.assignments || 0}</p>
                            </div>
                            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <Calendar className="w-4 h-4 text-blue-600" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Kayıt</span>
                                </div>
                                <p className="text-xl font-black text-zinc-900 dark:text-white italic">
                                    {createdAt ? format(createdAt, 'yyyy', { locale: tr }) : 'N/A'}
                                </p>
                            </div>
                            <div className="p-5 bg-zinc-50 dark:bg-zinc-950 rounded-3xl border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <LogIn className="w-4 h-4 text-zinc-400" />
                                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Giriş</span>
                                </div>
                                <p className="text-[11px] font-black text-zinc-900 dark:text-white uppercase leading-tight mt-1">
                                    {lastLoginAt ? format(lastLoginAt, 'dd MMM', { locale: tr }) : 'HİÇ'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Son Görevler */}
                    {!isEditing && official.assignments && official.assignments.length > 0 && (
                        <div className="mb-8 space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">SON MÜSABAKALARI</span>
                                <div className="flex-1 mx-4 h-px bg-zinc-100 dark:bg-zinc-800" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {official.assignments.slice(0, 2).map((assignment: any) => (
                                    <div key={assignment.id} className="p-5 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4 group hover:border-red-500 transition-all">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center font-black text-xs text-zinc-400 group-hover:text-red-600 transition-colors shrink-0">
                                            {assignment.role.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black text-zinc-900 dark:text-white uppercase italic truncate">
                                                {assignment.match?.homeTeam} - {assignment.match?.awayTeam}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">
                                                {assignment.match?.date ? format(new Date(assignment.match.date), 'dd MMM yyyy', { locale: tr }) : 'Tarih Belirtilmedi'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-4 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <Phone className="w-4 h-4 text-zinc-400" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Telefon</p>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white">{official.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <Mail className="w-4 h-4 text-zinc-400" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">E-posta</p>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{official.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <MapPin className="w-4 h-4 text-zinc-400" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Atandığı Bölge(ler)</p>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {official.regions?.map((r: any) => r.name).join(', ') || 'Bölge Boş'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-3 bg-zinc-50/50 dark:bg-zinc-800/30 rounded-2xl group hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                            <Briefcase className="w-4 h-4 text-zinc-400" />
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Meslek / Kariyer</p>
                                <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">{official.job || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {!isEditing && (
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-zinc-900 dark:bg-zinc-100 rounded-3xl shadow-xl">
                            <div>
                                <p className="text-[10px] font-bold text-white/50 dark:text-zinc-900/50 uppercase tracking-[0.2em] px-2 italic">Hesap Statüsü</p>
                                <p className="text-xs font-black text-white dark:text-zinc-900 px-2 mt-0.5 uppercase tracking-widest">
                                    {isActive ? "SİSTEME ERİŞİM AKTİF" : "ERİŞİM KISITLANDI"}
                                </p>
                            </div>
                            <button
                                onClick={onToggleActive}
                                className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isActive
                                    ? "bg-red-600 text-white hover:bg-red-700 shadow-red-600/20"
                                    : "bg-green-600 text-white hover:bg-green-700 shadow-green-600/20"
                                    }`}
                            >
                                {isActive ? "PASİFE AL" : "AKTİF ET"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
