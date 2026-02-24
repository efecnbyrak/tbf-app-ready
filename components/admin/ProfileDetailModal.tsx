"use client";

import { X, Calendar, LogIn, Trophy, UserSquare2, Phone, Mail, MapPin, Briefcase, Hash } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

interface ProfileDetailModalProps {
    official: any;
    onClose: () => void;
    onToggleActive?: () => void;
}

export function ProfileDetailModal({ official, onClose, onToggleActive }: ProfileDetailModalProps) {
    if (!official) return null;

    const isActive = official.user?.isActive ?? true;
    const createdAt = official.user?.createdAt ? new Date(official.user.createdAt) : null;
    const lastLoginAt = official.user?.lastLoginAt ? new Date(official.user.lastLoginAt) : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 rounded-full transition-all z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header / Cover */}
                <div className="h-32 bg-gradient-to-r from-red-600 to-red-800" />

                <div className="px-8 pb-8 -mt-16">
                    <div className="flex flex-col md:flex-row md:items-end gap-6 mb-8">
                        {/* Avatar */}
                        <div className="w-32 h-32 rounded-3xl bg-white dark:bg-zinc-900 p-2 shadow-xl border-4 border-white dark:border-zinc-900">
                            <div className="w-full h-full rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {official.imageUrl ? (
                                    <img src={official.imageUrl} alt={official.firstName} className="w-full h-full object-cover" />
                                ) : (
                                    <UserSquare2 className="w-16 h-16 text-zinc-300" />
                                )}
                            </div>
                        </div>

                        <div className="flex-1 pb-2">
                            <h2 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic">
                                {official.firstName} {official.lastName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-black rounded-lg">
                                    {official.classification || "BELİRTİLMEMİŞ"}
                                </span>
                                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-black rounded-lg uppercase italic">
                                    {official.officialType === "REFEREE" ? "HAKEM" : "GÖREVLİ"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <Calendar className="w-4 h-4 text-red-600" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Kayıt Tarihi</span>
                            </div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                {createdAt ? format(createdAt, 'dd MMMM yyyy', { locale: tr }) : 'Bilinmiyor'}
                            </p>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <LogIn className="w-4 h-4 text-blue-600" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">Son Giriş</span>
                            </div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                {lastLoginAt ? format(lastLoginAt, 'dd.MM.yyyy HH:mm', { locale: tr }) : 'Giriş yapılmadı'}
                            </p>
                        </div>

                        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-3 mb-2">
                                <Trophy className="w-4 h-4 text-orange-500" />
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">İstatistik</span>
                            </div>
                            <p className="text-sm font-bold text-zinc-900 dark:text-white">
                                {official._count?.assignments || 0} Görev / {official.classification}
                            </p>
                        </div>
                    </div>

                    {/* Latest Assignments Section */}
                    {official.assignments && official.assignments.length > 0 && (
                        <div className="mb-8 space-y-3">
                            <div className="flex items-center gap-3 px-2">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">SON GÖREVLERİ</span>
                                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {official.assignments.slice(0, 2).map((assignment: any) => (
                                    <div key={assignment.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-black text-zinc-900 dark:text-white uppercase italic">
                                                {assignment.match?.homeTeam} vs {assignment.match?.awayTeam}
                                            </p>
                                            <p className="text-[10px] font-bold text-zinc-400 uppercase mt-0.5">
                                                {assignment.match?.date ? format(new Date(assignment.match.date), 'dd.MM.yyyy', { locale: tr }) : 'Tarih Belirtilmedi'} • {assignment.role}
                                            </p>
                                        </div>
                                        <div className="px-3 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-black italic">
                                            {assignment.match?.league || 'LİG BİLGİSİ YOK'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    {/* Contact Info */}
                    <div className="space-y-4 bg-zinc-50 dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                                    <Phone className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Telefon</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{official.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                                    <Mail className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div className="max-w-full overflow-hidden">
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">E-posta</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">{official.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                                    <Hash className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">TCKN</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{official.tckn}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                                    <Briefcase className="w-4 h-4 text-zinc-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Meslek</p>
                                    <p className="text-sm font-bold text-zinc-900 dark:text-white">{official.job || 'Belirtilmemiş'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-start gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-900 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 shrink-0">
                                <MapPin className="w-4 h-4 text-zinc-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em]">Adres</p>
                                <p className="text-sm font-bold text-zinc-900 dark:text-white">{official.address || 'Belirtilmemiş'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex justify-between items-center bg-red-50 dark:bg-red-900/10 p-4 rounded-3xl border border-red-100 dark:border-red-900/30">
                        <p className="text-xs font-bold text-red-800 dark:text-red-400 px-2 italic">
                            Hesap Durumu: {isActive ? 'AKTİF' : 'PASİF'}
                        </p>
                        <button
                            onClick={onToggleActive}
                            className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isActive
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                        >
                            {isActive ? 'PASİFE AL' : 'AKTİF ET'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
