"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Calendar, LogIn, Trophy, UserSquare2, Phone, Mail, MapPin, Briefcase, Hash, Edit3, Save, RotateCcw, Shield, Star, AlertCircle, Check, Search, ShieldCheck, ChevronDown, UserMinus } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { updateRefereeProfile, deleteUser } from "@/app/actions/admin-users";
import { demoteFromAdmin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { TURKEY_CITIES, OFFICIAL_TYPES, CLASSIFICATIONS } from "@/lib/constants";

interface ProfileDetailModalProps {
    official: any;
    onClose: () => void;
    onToggleActive?: () => void;
    onPromote?: () => void;
    isSuperAdmin?: boolean;
}

export function ProfileDetailModal({ official, onClose, onToggleActive, onPromote, isSuperAdmin }: ProfileDetailModalProps) {
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

    // Detect if data has changed to show save button
    const hasChanges =
        editData.classification !== (official.classification || "BELIRLENMEMIS") ||
        editData.officialType !== (official.officialType || "REFEREE") ||
        editData.suspendedUntil !== (official.user?.suspendedUntil ? new Date(official.user.suspendedUntil).toISOString().split('T')[0] : "") ||
        JSON.stringify(editData.regionIds) !== JSON.stringify(official.regions?.map((r: any) => r.id) || []);

    const maskTCKN = (tckn: string) => {
        if (!tckn || tckn.length < 11) return tckn;
        return `${tckn.substring(0, 2)}********${tckn.substring(10, 11)}`;
    };

    useEffect(() => {
        fetch("/api/regions")
            .then(res => res.json())
            .then(data => setAvailableRegions(data))
            .catch(err => console.error("Region fetch failed:", err));
    }, []);

    if (!official) return null;

    const isActive = official.user?.isActive ?? true;
    const isSuspended = official.user?.suspendedUntil && new Date(official.user.suspendedUntil) > new Date();
    const isReferee = official.officialType === "REFEREE";
    const isObserver = official.officialType === "OBSERVER";
    const isAdmin = ["ADMIN", "ADMIN_IHK", "SUPER_ADMIN"].includes(official.user?.role?.name || "");

    const handleSave = () => {
        startTransition(async () => {
            const res = await updateRefereeProfile(official.userId, {
                ...editData,
                suspendedUntil: editData.suspendedUntil ? new Date(editData.suspendedUntil) : null,
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

    const handleDemote = () => {
        if (!confirm("Bu kullanıcının yöneticilik yetkisini almak istediğinize emin misiniz?")) return;
        startTransition(async () => {
            const res = await demoteFromAdmin(official.userId);
            if (res.success) {
                router.refresh();
                onClose();
            } else {
                alert("Hata: " + res.error);
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("DİKKAT! Bu işlem geri alınamaz.\nBu kullanıcıyı ve kullanıcıya ait TÜM VERİLERİ (Uygunluklar, Maçlar, Sınav Sonuçları vb.) kalıcı olarak silmek istediğinize emin misiniz?")) return;

        startTransition(async () => {
            const res = await deleteUser(official.userId);
            if (res.success) {
                alert(res.message);
                router.refresh();
                onClose();
            } else {
                alert("Hata: " + res.message);
            }
        });
    };

    const toggleRegion = (id: number) => {
        setEditData(prev => ({
            ...prev,
            regionIds: [id]
        }));
        setEditingField(null);
    };

    const selectedRegionName = availableRegions.find(r => editData.regionIds.includes(r.id))?.name || "Belirtilmemiş";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">

                {/* Header/Close Button (Mobile Overlay) */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 rounded-2xl transition-all z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 h-full max-h-[90vh] overflow-y-auto lg:overflow-visible">

                    {/* LEFT PANEL: Profile Overview (Col 4) */}
                    <div className="lg:col-span-4 bg-zinc-50 dark:bg-zinc-950/50 p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-zinc-100 dark:border-zinc-800 flex flex-col items-center text-center pb-32">
                        <div className="relative group">
                            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-[3rem] bg-white dark:bg-zinc-800 border-8 border-white dark:border-zinc-800 shadow-2xl overflow-hidden mb-6 group-hover:scale-[1.02] transition-transform duration-500">
                                {official.imageUrl ? (
                                    <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center">
                                        <UserSquare2 className="w-20 h-20 text-zinc-300 dark:text-zinc-700" />
                                    </div>
                                )}
                                {isSuspended && (
                                    <div className="absolute inset-0 bg-red-600/40 backdrop-blur-[2px] flex items-center justify-center">
                                        <div className="bg-red-600 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-xl">CEZALI</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white leading-tight uppercase tracking-tighter">
                                {official.firstName} <br /> {official.lastName}
                            </h2>
                            <div className="flex items-center justify-center gap-2 text-zinc-400 font-bold text-[10px] tracking-widest uppercase">
                                <Hash className="w-3 h-3" />
                                {maskTCKN(official.tckn)}
                            </div>
                        </div>

                        <div className="w-full space-y-3">
                            {/* Mission Badge - Custom Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setEditingField(editingField === 'type' ? null : 'type')}
                                    className={`w-full p-4 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all hover:scale-[1.02] border-2 ${editingField === 'type' ? 'bg-white dark:bg-zinc-800 border-red-50' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent'}`}
                                >
                                    <span className={`text-[8px] font-black tracking-[0.3em] uppercase ${editingField === 'type' ? 'text-zinc-400' : 'text-zinc-400 dark:text-zinc-500'}`}>GÖREV TÜRÜ</span>
                                    <span className={`text-sm font-black tracking-tight uppercase flex items-center gap-2 ${editingField === 'type' ? 'text-zinc-900 dark:text-white' : ''}`}>
                                        <Shield className="w-4 h-4 text-red-500" />
                                        {OFFICIAL_TYPES.find(t => t.id === editData.officialType)?.label || "BELİRTİLMEMİŞ"}
                                        <ChevronDown className={`w-3 h-3 transition-transform ${editingField === 'type' ? 'rotate-180' : ''}`} />
                                    </span>
                                </button>
                                {editingField === 'type' && (
                                    <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] overflow-hidden py-2 animate-in slide-in-from-top-2 duration-200">
                                        {OFFICIAL_TYPES.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => { setEditData({ ...editData, officialType: t.id }); setEditingField(null); }}
                                                className={`w-full text-left px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between ${editData.officialType === t.id ? 'text-red-600 bg-red-50 dark:bg-red-900/10' : 'text-zinc-500 dark:text-zinc-400'}`}
                                            >
                                                {t.label}
                                                {editData.officialType === t.id && <Check className="w-4 h-4" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Classification Badge - Custom Dropdown */}
                            {(isReferee || official.classification !== "BELIRLENMEMIS") && (
                                <div className="relative">
                                    <button
                                        onClick={() => setEditingField(editingField === 'class' ? null : 'class')}
                                        className={`w-full p-4 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all hover:shadow-xl border-2 ${editingField === 'class' ? 'bg-white dark:bg-zinc-800 border-red-50 shadow-red-500/10' : 'bg-red-600 text-white border-transparent shadow-red-600/20'}`}
                                    >
                                        <span className={`text-[8px] font-black tracking-[0.3em] uppercase ${editingField === 'class' ? 'text-zinc-400' : 'text-red-200'}`}>KLASMAN</span>
                                        <span className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                                            {CLASSIFICATIONS.find(c => c.id === editData.classification)?.label || "BELİRTİLMEMİŞ"}
                                            <ChevronDown className={`w-3 h-3 transition-transform ${editingField === 'class' ? 'rotate-180' : ''}`} />
                                        </span>
                                    </button>
                                    {editingField === 'class' && (
                                        <div className="absolute top-[calc(100%+8px)] left-0 w-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100] overflow-hidden py-2 animate-in slide-in-from-top-2 duration-200">
                                            {CLASSIFICATIONS.map(c => (
                                                <button
                                                    key={c.id}
                                                    onClick={() => { setEditData({ ...editData, classification: c.id }); setEditingField(null); }}
                                                    className={`w-full text-left px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-between ${editData.classification === c.id ? 'text-red-600 bg-red-50 dark:bg-red-900/10' : 'text-zinc-500 dark:text-zinc-400'}`}
                                                >
                                                    {c.label}
                                                    {editData.classification === c.id && <Check className="w-4 h-4" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Promote/Demote Actions */}
                            {isSuperAdmin && isObserver && !isAdmin && (
                                <button
                                    onClick={() => { if (onPromote) onPromote(); }}
                                    className="w-full p-4 bg-emerald-600 text-white rounded-[1.5rem] flex flex-col items-center gap-1 group transition-all hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/20 mt-4"
                                >
                                    <span className="text-[8px] font-black text-emerald-100 tracking-[0.3em] uppercase">YÖNETİM</span>
                                    <span className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        YÖNETİCİ YAP
                                    </span>
                                </button>
                            )}

                            {isSuperAdmin && isAdmin && official.user?.role?.name !== "SUPER_ADMIN" && (
                                <button
                                    onClick={handleDemote}
                                    className="w-full p-4 bg-indigo-600 text-white rounded-[1.5rem] flex flex-col items-center gap-1 group transition-all hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/20 mt-4"
                                >
                                    <span className="text-[8px] font-black text-indigo-100 tracking-[0.3em] uppercase">YÖNETİM</span>
                                    <span className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                                        <UserMinus className="w-4 h-4" />
                                        YÖNETİCİLİĞİ AL
                                    </span>
                                </button>
                            )}

                            {isSuperAdmin && official.user?.role?.name !== "SUPER_ADMIN" && (
                                <button
                                    onClick={handleDelete}
                                    className="w-full p-4 bg-zinc-950 text-red-500 rounded-[1.5rem] flex flex-col items-center gap-1 group transition-all hover:bg-red-600 hover:text-white hover:shadow-xl hover:shadow-red-600/20 mt-4 border-2 border-red-900/20"
                                >
                                    <span className="text-[8px] font-black tracking-[0.3em] uppercase opacity-70">KALICI İŞLEM</span>
                                    <span className="text-sm font-black tracking-tight uppercase flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        KULLANICIYI SİL
                                    </span>
                                </button>
                            )}

                            {isAdmin && (
                                <div className="w-full p-4 bg-indigo-600 text-white rounded-[1.5rem] flex flex-col items-center gap-1">
                                    <span className="text-[8px] font-black text-indigo-100 tracking-[0.3em] uppercase">ROL</span>
                                    <span className="text-sm font-black tracking-tight uppercase italic flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4" />
                                        ADMİN / YÖNETİCİ
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT PANEL: Details (Col 8) */}
                    <div className="lg:col-span-8 p-8 lg:p-12 lg:overflow-y-auto bg-white dark:bg-zinc-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Contact Card */}
                            <div className="md:col-span-2 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 group hover:shadow-xl hover:shadow-zinc-500/5 transition-all">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">İLETİŞİM BİLGİLERİ</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <a href={`tel:${official.phone}`} className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-red-500 transition-colors shadow-sm">
                                        <div className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-zinc-400">TELEFON</span>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white">{official.phone}</span>
                                        </div>
                                    </a>
                                    <a href={`mailto:${official.email}`} className="md:col-span-2 flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-red-500 transition-colors shadow-sm max-w-full overflow-hidden">
                                        <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[8px] font-black text-zinc-400">E-POSTA</span>
                                            <span className="text-sm font-bold text-zinc-900 dark:text-white truncate">{official.email}</span>
                                        </div>
                                    </a>
                                </div>
                            </div>

                            {/* Region & Job */}
                            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">BÖLGE & MESLEK</h3>
                                <div className="space-y-4">
                                    <div className="relative">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-zinc-400 mb-1">ŞEHİR / BÖLGE</span>
                                            <button
                                                onClick={() => setEditingField('region')}
                                                className="flex items-center gap-3 text-sm font-black text-zinc-900 dark:text-white hover:text-red-600 transition-colors"
                                            >
                                                <MapPin className="w-4 h-4 text-red-600" />
                                                {selectedRegionName}
                                            </button>
                                        </div>
                                        {editingField === 'region' && (
                                            <div className="absolute top-0 left-0 w-full z-40">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={citySearch}
                                                        onChange={(e) => setCitySearch(e.target.value)}
                                                        className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-900 rounded-xl text-xs font-bold border-2 border-red-500 shadow-xl"
                                                        placeholder="Şehir Ara..."
                                                    />
                                                    <div className="absolute top-full left-0 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700">
                                                        {availableRegions
                                                            .filter(r => r.name.toLowerCase().includes(citySearch.toLowerCase()))
                                                            .map(r => (
                                                                <button
                                                                    key={r.id}
                                                                    onClick={() => toggleRegion(r.id)}
                                                                    className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-700 border-b border-zinc-100 last:border-0"
                                                                >
                                                                    {r.name}
                                                                </button>
                                                            ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-zinc-400 mb-1">MESLEK</span>
                                        <div className="flex items-center gap-3 text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                            <Briefcase className="w-4 h-4 text-zinc-400" />
                                            {official.job || "BELİRTİLMEMİŞ"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Discipline Card */}
                            <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">DİSİPLİN DURUMU</h3>
                                <div className="space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-zinc-400 mb-1 tracking-tighter uppercase">Ceza Bitiş Tarihi</span>
                                        <input
                                            type="date"
                                            value={editData.suspendedUntil}
                                            onChange={(e) => setEditData({ ...editData, suspendedUntil: e.target.value })}
                                            className="w-full px-4 py-3 bg-white dark:bg-zinc-900 rounded-2xl text-xs font-black border-2 border-transparent focus:border-red-500 outline-none transition-all shadow-sm group-hover:bg-zinc-50 shadow-red-600/5 uppercase"
                                        />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full animate-pulse ${isSuspended ? 'bg-red-600 shadow-[0_0_12px_rgba(220,38,38,0.5)]' : 'bg-emerald-600 shadow-[0_0_12px_rgba(5,150,105,0.5)]'}`} />
                                        <span className="text-[10px] font-black text-zinc-900 dark:text-white tracking-widest uppercase">
                                            {isSuspended ? "DİSİPLİN CEZASI VAR" : "TEMİZ SİCİL"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Account Visibility Toggle */}
                            <div className="md:col-span-2 flex items-center justify-between p-6 bg-zinc-900 dark:bg-zinc-100 rounded-[2rem] shadow-xl mt-8">
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

                            {/* PERSISTENT SAVE BUTTON (NON-BLOCKING POSITION) */}
                            <div className="md:col-span-2 pt-8 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending || !hasChanges}
                                    className={`w-full p-5 rounded-[2.5rem] shadow-2xl transition-all flex items-center justify-center gap-4 hover:scale-[1.01] active:scale-95 z-10 ${hasChanges ? 'bg-red-600 text-white shadow-red-600/40 cursor-pointer' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50'}`}
                                >
                                    <Save className={`w-6 h-6 ${isPending ? 'animate-bounce' : ''}`} />
                                    <span className="font-black text-lg tracking-tight uppercase">{isPending ? "KAYDEDİLİYOR..." : "DEĞİŞİKLİKLERİ KAYDET"}</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
