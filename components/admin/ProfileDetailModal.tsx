"use client";

import { useState, useTransition, useEffect } from "react";
import { X, Calendar, LogIn, Trophy, UserSquare2, Phone, Mail, MapPin, Briefcase, Hash, Edit3, Save, RotateCcw, Shield, Star, AlertCircle, Check, Search, ShieldCheck, ChevronDown, UserMinus, Copy, CheckCheck, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { updateRefereeProfile, deleteUser, addPenalty, deletePenalty, removeUserAvatar } from "@/app/actions/admin-users";
import { demoteFromAdmin } from "@/app/actions/auth";
import { useRouter } from "next/navigation";
import { TURKEY_CITIES, OFFICIAL_TYPES, CLASSIFICATIONS } from "@/lib/constants";
import { formatIBAN } from "@/lib/format-utils";

interface ProfileDetailModalProps {
    official: any;
    onClose: () => void;
    onToggleActive?: () => void;
    onPromote?: () => void;
    onDemote?: () => void;
    isSuperAdmin?: boolean;
    currentUserEmail?: string | null;
}

export function ProfileDetailModal({ official, onClose, onToggleActive, onPromote, onDemote, isSuperAdmin, currentUserEmail }: ProfileDetailModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [isDeletingAvatar, startAvatarTransition] = useTransition();
    const router = useRouter();
    const [isIbanCopied, setIsIbanCopied] = useState(false);

    // Inline edit state
    const [editingField, setEditingField] = useState<string | null>(null);

    // Edit State
    const [editData, setEditData] = useState({
        firstName: official.firstName || "",
        lastName: official.lastName || "",
        classification: official.classification || "BELIRLENMEMIS",
        officialType: official.officialType || "REFEREE",
        suspendedUntil: official.user?.suspendedUntil ? new Date(official.user.suspendedUntil).toISOString().split('T')[0] : "",
        regionIds: official.regions?.map((r: any) => r.id) || [],
        address: official.address || "",
        iban: formatIBAN(official.iban || ""),
        email: official.email || "",
        phone: official.phone || ""
    });

    const [availableRegions, setAvailableRegions] = useState<any[]>([]);
    const [citySearch, setCitySearch] = useState("");

    // Success State
    const [showSuccess, setShowSuccess] = useState(false);

    // Detect if data has changed to show save button
    // Penalty State
    const [penalties, setPenalties] = useState(official.user?.penalties || []);
    const [isAddingPenalty, setIsAddingPenalty] = useState(false);
    const [newPenalty, setNewPenalty] = useState({
        type: "SUSPENSION",
        reason: "",
        startDate: new Date().toISOString().split('T')[0],
        endDate: ""
    });

    const hasChanges =
        editData.firstName !== (official.firstName || "") ||
        editData.lastName !== (official.lastName || "") ||
        editData.classification !== (official.classification || "BELIRLENMEMIS") ||
        editData.officialType !== (official.officialType || "REFEREE") ||
        editData.suspendedUntil !== (official.user?.suspendedUntil ? new Date(official.user.suspendedUntil).toISOString().split('T')[0] : "") ||
        JSON.stringify(editData.regionIds) !== JSON.stringify(official.regions?.map((r: any) => r.id) || []) ||
        editData.address !== (official.address || "") ||
        editData.iban !== (official.iban || "") ||
        editData.email !== (official.email || "") ||
        editData.phone !== (official.phone || "");

    const maskTCKN = (tckn: string) => {
        if (!tckn || tckn.length < 11) return tckn;
        return `${tckn.substring(0, 2)}******** ${tckn.substring(10, 11)} `;
    };

    useEffect(() => {
        // Prevent background scrolling when modal is open
        document.body.style.overflow = "hidden";

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);

        fetch("/api/regions")
            .then(res => res.json())
            .then(data => setAvailableRegions(data))
            .catch(err => console.error("Region fetch failed:", err));

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

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
                setShowSuccess(true);
                setTimeout(() => setShowSuccess(false), 3000);
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

    const handleAddPenalty = () => {
        if (!newPenalty.reason) {
            alert("Lütfen ceza nedenini giriniz.");
            return;
        }
        startTransition(async () => {
            const res = await addPenalty(official.userId, {
                ...newPenalty,
                startDate: new Date(newPenalty.startDate),
                endDate: newPenalty.endDate ? new Date(newPenalty.endDate) : null
            });
            if (res.success) {
                setPenalties([...penalties, res.penalty]);
                setIsAddingPenalty(false);
                setNewPenalty({
                    type: "SUSPENSION",
                    reason: "",
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: ""
                });
                router.refresh();
            } else {
                alert("Hata: Ceza eklenemedi.");
            }
        });
    };

    const handleDeletePenalty = (id: number) => {
        if (!confirm("Bu cezayı silmek istediğinize emin misiniz?")) return;
        startTransition(async () => {
            const res = await deletePenalty(id);
            if (res.success) {
                setPenalties(penalties.filter((p: any) => p.id !== id));
                router.refresh();
            } else {
                alert("Hata: Ceza silinemedi.");
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
        <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-start bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-500 overflow-y-auto overflow-x-hidden pt-4 pb-12 sm:pt-8 sm:pb-20"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-5xl bg-white dark:bg-zinc-900 sm:rounded-[3.5rem] shadow-[0_48px_80px_-16px_rgba(0,0,0,0.4)] border sm:border-zinc-200/60 dark:sm:border-zinc-800/60 animate-in zoom-in-95 slide-in-from-bottom-12 duration-700 mx-auto"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Success Message Overlay */}
                {showSuccess && (
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[110] animate-in slide-in-from-top-4 duration-500 pointer-events-none">
                        <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30 flex items-center gap-3 border-2 border-emerald-400/20">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <Check className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black uppercase tracking-widest italic text-sm">Başarıyla Kaydedildi</span>
                        </div>
                    </div>
                )}

                {/* Header/Close Button (Mobile Overlay) */}
                <button
                    onClick={onClose}
                    className="absolute top-8 right-8 p-3.5 bg-zinc-100/80 dark:bg-zinc-800/80 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 backdrop-blur-md text-zinc-500 rounded-2xl transition-all duration-300 shadow-xl shadow-black/5 hover:scale-110 active:scale-90 z-20 group"
                >
                    <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-12 h-full">

                    {/* LEFT PANEL: Profile Overview (Col 4) */}
                    <div className="lg:col-span-4 bg-zinc-50/80 dark:bg-zinc-950/40 p-10 lg:p-14 border-b lg:border-b-0 lg:border-r border-zinc-100/80 dark:border-zinc-800/80 flex flex-col items-center text-center">
                        <div className="flex flex-col items-center gap-4 mb-6">
                            <div className="relative group perspective-1000">
                                <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-[3.5rem] bg-white dark:bg-zinc-800 border-[10px] border-white dark:border-zinc-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-300">
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

                            {official.imageUrl && (
                                <button
                                    onClick={() => {
                                        if (confirm("Kullanıcının profil fotoğrafını silmek istediğinize emin misiniz?")) {
                                            startAvatarTransition(async () => {
                                                const res = await removeUserAvatar(official.userId);
                                                if (res.success) {
                                                    router.refresh();
                                                } else {
                                                    alert(res.error || "Hata oluştu.");
                                                }
                                            });
                                        }
                                    }}
                                    disabled={isDeletingAvatar}
                                    className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-full text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{isDeletingAvatar ? "KALDIRILIYOR..." : "FOTOĞRAFI KALDIR"}</span>
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-col items-start">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">AD (DÜZENLENEBİLİR)</span>
                                    <input
                                        type="text"
                                        value={editData.firstName}
                                        onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 focus:border-red-500 rounded-xl px-4 py-2 text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter outline-none transition-all"
                                        placeholder="AD"
                                    />
                                </div>
                                <div className="flex flex-col items-start">
                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1 italic">SOYAD (DÜZENLENEBİLİR)</span>
                                    <input
                                        type="text"
                                        value={editData.lastName}
                                        onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                                        className="w-full bg-white dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-800 focus:border-red-500 rounded-xl px-4 py-2 text-xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter outline-none transition-all"
                                        placeholder="SOYAD"
                                    />
                                </div>
                                {isAdmin && (
                                    <div className="flex justify-center mt-1">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-lg shadow-lg shadow-indigo-600/20">
                                            <ShieldCheck className="w-3 h-3" />
                                            YÖNETİCİ
                                        </span>
                                    </div>
                                )}
                            </div>
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

                            {/* Classification Badge - Custom Dropdown - ONLY for Referees */}
                            {editData.officialType === "REFEREE" && (
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
                            {(isSuperAdmin || currentUserEmail === "talatmustafaozdemir@gmail.com") && !isAdmin && (
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

                            {(isSuperAdmin || currentUserEmail === "talatmustafaozdemir@gmail.com") && isAdmin && official.user?.role?.name !== "SUPER_ADMIN" && (
                                <button
                                    onDoubleClick={handleDemote}
                                    title="Yöneticiliği Al (Çift Tıklayın)"
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
                    <div className="lg:col-span-8 p-8 lg:p-12 bg-white dark:bg-zinc-900">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Contact Card */}
                            <div className="md:col-span-2 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 group hover:shadow-xl hover:shadow-zinc-500/5 transition-all">
                                <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">İLETİŞİM BİLGİLERİ</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus-within:border-red-500 transition-colors shadow-sm">
                                        <a href={`tel:${official.phone}`} className="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                                            <Phone className="w-5 h-5" />
                                        </a>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <span className="text-[8px] font-black text-zinc-400">TELEFON (DÜZENLENEBİLİR)</span>
                                            <input
                                                type="text"
                                                value={editData.phone}
                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                className="w-full bg-transparent outline-none text-sm font-bold text-zinc-900 dark:text-white tracking-wide placeholder:text-zinc-400"
                                                placeholder="05XX XXX XX XX"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 focus-within:border-red-500 transition-colors shadow-sm max-w-full overflow-hidden">
                                        <a href={`mailto:${official.email}`} className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 flex-shrink-0 hover:scale-110 transition-transform cursor-pointer">
                                            <Mail className="w-5 h-5" />
                                        </a>
                                        <div className="flex flex-col min-w-0 w-full">
                                            <span className="text-[8px] font-black text-zinc-400">E-POSTA (DÜZENLENEBİLİR)</span>
                                            <input
                                                type="email"
                                                value={editData.email}
                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                className="w-full bg-transparent outline-none text-sm font-bold text-zinc-900 dark:text-white truncate placeholder:text-zinc-400"
                                                placeholder="ornek@email.com"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Address & Layout Box */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Region & Job */}
                                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">BÖLGE & MESLEK</h3>
                                    <div className="space-y-4">
                                        <div className="relative">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-zinc-400 mb-1 uppercase">ŞEHİR / BÖLGE</span>
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
                                                                        className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-zinc-50 dark:bg-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 border-b border-zinc-100 last:border-0"
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
                                            <span className="text-[8px] font-black text-zinc-400 mb-1 uppercase">MESLEK</span>
                                            <div className="flex items-center gap-3 text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                                                <Briefcase className="w-4 h-4 text-zinc-400" />
                                                {official.job || "BELİRTİLMEMİŞ"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Full Address Box next to Region */}
                                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-4">AÇIK ADRES</h3>
                                    <div className="flex flex-col h-[calc(100%-24px)]">
                                        <div className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex-1 group focus-within:border-red-500 transition-colors">
                                            <MapPin className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                                            <textarea
                                                value={editData.address}
                                                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                                className="w-full bg-transparent outline-none resize-y min-h-[60px] max-h-[150px] text-xs font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed italic h-full"
                                                placeholder="Adres Bilgisi Giriniz..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* IBAN Card */}
                            <div className="md:col-span-2 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                <div className="space-y-6">
                                    <div className="flex flex-col relative group/iban">
                                        <span className="text-[8px] font-black text-zinc-400 mb-2 uppercase flex items-center justify-between">
                                            IBAN NUMARASI
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(editData.iban);
                                                    setIsIbanCopied(true);
                                                    setTimeout(() => setIsIbanCopied(false), 2000);
                                                }}
                                                className="flex items-center gap-1 text-[8px] tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
                                                title="IBAN'ı Kopyala"
                                            >
                                                {isIbanCopied ? <CheckCheck className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                {isIbanCopied ? "KOPYALANDI" : "KOPYALA"}
                                            </button>
                                        </span>
                                        <div className="flex items-center gap-3 p-4 bg-zinc-900 dark:bg-red-600 text-white rounded-2xl shadow-lg shadow-zinc-900/10 focus-within:ring-2 ring-red-500/50">
                                            <Hash className="w-5 h-5 opacity-70" />
                                            <input
                                                type="text"
                                                value={editData.iban}
                                                onChange={(e) => setEditData({ ...editData, iban: formatIBAN(e.target.value) })}
                                                className="w-full bg-transparent outline-none text-sm font-black tracking-widest font-mono placeholder:text-white/50"
                                                placeholder="TR00 0000 0000 0000 0000 0000 00"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Discipline Card */}
                            <div className="md:col-span-2 p-6 bg-zinc-50 dark:bg-zinc-800/50 rounded-[2rem] border border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">ATAMA KISITLAMALARI</h3>
                                    <button
                                        onClick={() => setIsAddingPenalty(!isAddingPenalty)}
                                        className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline"
                                    >
                                        {isAddingPenalty ? "İptal" : "+ Yeni Kısıtlama Ekle"}
                                    </button>
                                </div>

                                {isAddingPenalty ? (
                                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border-2 border-red-100 dark:border-red-900/20 space-y-4 mb-6 animate-in slide-in-from-top-4 duration-300">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[8px] font-black text-zinc-400 uppercase mb-1 block">Kısıtlama Türü</label>
                                                <select
                                                    value={newPenalty.type}
                                                    onChange={(e) => setNewPenalty({ ...newPenalty, type: e.target.value })}
                                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold border-none outline-none"
                                                >
                                                    <option value="SUSPENSION">Maç Cezası (Askıya Alma)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-zinc-400 uppercase mb-1 block">Başlangıç Tarihi</label>
                                                <input
                                                    type="date"
                                                    value={newPenalty.startDate}
                                                    onChange={(e) => setNewPenalty({ ...newPenalty, startDate: e.target.value })}
                                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold border-none outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-zinc-400 uppercase mb-1 block">Bitiş Tarihi (Opsiyonel)</label>
                                                <input
                                                    type="date"
                                                    value={newPenalty.endDate}
                                                    onChange={(e) => setNewPenalty({ ...newPenalty, endDate: e.target.value })}
                                                    className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold border-none outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-zinc-400 uppercase mb-1 block">Kısıtlama Nedeni</label>
                                            <textarea
                                                value={newPenalty.reason}
                                                onChange={(e) => setNewPenalty({ ...newPenalty, reason: e.target.value })}
                                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-xl text-xs font-bold border-none outline-none min-h-[80px]"
                                                placeholder="Cezanın detaylı nedenini yazınız..."
                                            />
                                        </div>
                                        <button
                                            onClick={handleAddPenalty}
                                            disabled={isPending}
                                            className="w-full py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                                        >
                                            Kısıtlamayı Onayla ve Kaydet
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {penalties.length === 0 ? (
                                            <div className="py-8 text-center bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 border-dashed">
                                                <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest italic font-mono opacity-50">Kayıt Bulunmamaktadır</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {penalties.map((p: any) => (
                                                    <div key={p.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between group transition-all hover:border-red-500/30">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${p.type === 'SUSPENSION' ? 'bg-red-100 text-red-600' : p.type === 'WARNING' ? 'bg-orange-100 text-orange-600' : 'bg-zinc-100 text-zinc-600'}`}>
                                                                    {p.type === 'SUSPENSION' ? 'Hak Mahrumiyeti' : p.type === 'WARNING' ? 'Uyarı' : 'Para Cezası'}
                                                                </span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase">
                                                                    {new Date(p.startDate).toLocaleDateString('tr-TR')}
                                                                    {p.endDate && ` - ${new Date(p.endDate).toLocaleDateString('tr-TR')} `}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{p.reason}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeletePenalty(p.id)}
                                                            className="opacity-0 group-hover:opacity-100 p-2 text-zinc-400 hover:text-red-600 transition-all"
                                                        >
                                                            <RotateCcw className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-zinc-400 mb-1 tracking-tighter uppercase">Hesap Askı Bitiş Tarihi (Manuel Kontrol)</span>
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
                                            {isSuspended ? "ATAMA KISITLAMASI VAR" : "TEMİZ"}
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
                            <div className="md:col-span-2 pt-6 mt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <button
                                    onClick={handleSave}
                                    disabled={isPending || !hasChanges}
                                    className={`w-full max-w-sm mx-auto p-4 rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 z-10 ${hasChanges ? 'bg-red-600 text-white shadow-red-600/30 hover:bg-red-500 cursor-pointer' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed opacity-50'}`}
                                >
                                    <div className={`transition-all ${isPending ? 'animate-spin' : ''}`}>
                                        <Save className="w-5 h-5" />
                                    </div>
                                    <span className="font-bold text-sm tracking-wider uppercase">{isPending ? "GÜNCELLENİYOR..." : "DEĞİŞİKLİKLERİ UYGULA"}</span>
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
