"use client";

import React, { useState, useEffect } from "react";
import {
    BookOpen,
    Plus,
    Trash2,
    Users,
    Calendar,
    CheckCircle2,
    Clock,
    Target,
    LayoutGrid,
    Search,
    AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface Assignment {
    id: number;
    title: string;
    assignmentType: string;
    targetGroups: string;
    targetCategories: string;
    questionCount: number;
    dueDate: Date | null;
    isActive: boolean;
    createdAt: Date;
    createdBy: { username: string };
    _count: { attempts: number };
}

interface AssignmentsClientProps {
    initialAssignments: any[];
    categories: string[];
}

export function AssignmentsClient({ initialAssignments, categories }: AssignmentsClientProps) {
    const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Form states
    const [title, setTitle] = useState("");
    const [type, setType] = useState("HOMEWORK");
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [selectedCats, setSelectedCats] = useState<string[]>([]);
    const [count, setCount] = useState(20);
    const [dueDate, setDueDate] = useState("");

    const targetGroupOptions = [
        { id: "ALL", label: "Tüm Kullanıcılar" },
        { id: "REFEREE", label: "Tüm Hakemler" },
        { id: "OFFICIAL", label: "Tüm Genel Görevliler" },
        { id: "ADAY_HAKEM", label: "Aday Hakemler" },
        { id: "C_KLASMAN", label: "C Klasman Hakemler" },
        { id: "B_KLASMAN", label: "B Klasman Hakemler" },
        { id: "A_KLASMAN", label: "A Klasman Hakemler" },
        { id: "OBSERVER", label: "Gözlemciler" },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Category validation: require at least 3 categories
        if (selectedCats.length < 3) {
            alert("Lütfen en az 3 kategori seçin.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/admin/assignments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    type,
                    groups: selectedGroups.join(","),
                    categories: selectedCats.join(","),
                    count,
                    dueDate: dueDate || null
                })
            });

            if (res.ok) {
                const newAssignment = await res.json();
                setAssignments([newAssignment, ...assignments]);
                setIsCreateOpen(false);
                router.refresh();
                // Reset form
                setTitle("");
                setSelectedGroups([]);
                setSelectedCats([]);
                setDueDate("");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Bu ödevi silmek istediklerinize emin misiniz?")) return;

        try {
            const res = await fetch(`/api/admin/assignments?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setAssignments(assignments.filter(a => a.id !== id));
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div></div>
                <button
                    onClick={() => setIsCreateOpen(true)}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl transition-all shadow-lg shadow-red-600/20 font-bold active:scale-95"
                >
                    <Plus className="w-5 h-5" /> YENİ ÖDEV OLUŞTUR
                </button>
            </header>

            {/* Assignments List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments.map(assignment => (
                    <div key={assignment.id} className="group relative bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-3xl p-6 transition-all hover:border-red-600/50 hover:shadow-2xl overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full translate-x-16 -translate-y-16 group-hover:bg-red-600/10 transition-colors" />

                        <div className="flex justify-between items-start mb-6">
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black tracking-tighter uppercase ${assignment.assignmentType === 'HOMEWORK' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                {assignment.assignmentType === 'HOMEWORK' ? 'ZORUNLU ÖDEV' : 'PRATİK TEST'}
                            </div>
                            <button
                                onClick={() => handleDelete(assignment.id)}
                                className="p-2 text-zinc-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-4 line-clamp-2 italic uppercase tracking-tight leading-tight">
                            {assignment.title}
                        </h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase italic">
                                <Users className="w-4 h-4 text-zinc-400" />
                                <span>{assignment.targetGroups.split(',').join(' • ')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase italic">
                                <LayoutGrid className="w-4 h-4 text-zinc-400" />
                                <span>{assignment.targetCategories === 'ALL' ? 'Tüm Kategoriler' : assignment.targetCategories}</span>
                            </div>
                            {assignment.dueDate && (
                                <div className="flex items-center gap-2 text-xs text-red-600 font-black uppercase italic">
                                    <Clock className="w-4 h-4 text-red-500" />
                                    <span>Son Tarih: {format(new Date(assignment.dueDate), "d MMMM yyyy", { locale: tr })}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-lg font-black text-zinc-900 dark:text-white leading-none">{assignment.questionCount}</div>
                                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">SORU</div>
                                </div>
                                <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800" />
                                <div className="text-center">
                                    <div className="text-lg font-black text-zinc-900 dark:text-white leading-none">
                                        {assignment._count?.attempts || 0}
                                    </div>
                                    <div className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1">ÇÖZÜLDÜ</div>
                                </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${assignment.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-2 border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b-2 border-zinc-50 dark:border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/30">
                                    <BookOpen className="text-white w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase italic tracking-tight">Yeni Atama Oluştur</h2>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Sınav ve Ödev Parametreleri</p>
                                </div>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="p-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-2xl transition-all">
                                <X size={20} className="text-zinc-400" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                                {/* Title */}
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">ÖDEV BAŞLIĞI</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Örn: Mart Ayı Genel Bilgi Sınavı"
                                        required
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-600 rounded-2xl px-6 py-4 text-sm font-bold transition-all outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Type */}
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">ATAMA TÜRÜ</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {["HOMEWORK", "PRACTICE"].map((t) => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setType(t)}
                                                    className={`py-4 rounded-2xl text-[10px] font-black border-2 transition-all ${type === t ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-xl' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-transparent hover:border-zinc-200'}`}
                                                >
                                                    {t === "HOMEWORK" ? "ZORUNLU ÖDEV" : "SERBEST TEST"}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Question Count */}
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">SORU SAYISI</label>
                                        <input
                                            type="number"
                                            value={count}
                                            onChange={(e) => setCount(parseInt(e.target.value))}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-600 rounded-2xl px-6 py-4 text-sm font-bold transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Target Groups */}
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">HEDEF KİTLE</label>
                                    <div className="flex flex-wrap gap-2">
                                        {targetGroupOptions.map(group => (
                                            <button
                                                key={group.id}
                                                type="button"
                                                onClick={() => {
                                                    if (selectedGroups.includes(group.id)) {
                                                        setSelectedGroups(selectedGroups.filter(g => g !== group.id));
                                                    } else {
                                                        setSelectedGroups([...selectedGroups, group.id]);
                                                    }
                                                }}
                                                className={`px-4 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${selectedGroups.includes(group.id) ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-transparent'}`}
                                            >
                                                {group.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">SORU KATEGORİLERİ</label>
                                    <div className="grid grid-cols-1 min-[450px]:grid-cols-2 md:grid-cols-3 gap-3">
                                        {categories.map(cat => {
                                            const isSelected = selectedCats.includes(cat);
                                            return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => {
                                                    if (isSelected) {
                                                        setSelectedCats(selectedCats.filter(c => c !== cat));
                                                    } else {
                                                        setSelectedCats([...selectedCats, cat]);
                                                    }
                                                }}
                                                className={`relative overflow-hidden p-4 rounded-2xl text-left border-2 transition-all duration-300 group ${isSelected ? 'bg-zinc-900 dark:bg-white border-zinc-900 dark:border-white shadow-xl scale-[1.02]' : 'bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
                                            >
                                                {isSelected && <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 dark:bg-black/10 rounded-full blur-xl translate-x-8 -translate-y-8" />}
                                                <div className="flex flex-col gap-2 relative z-10">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-inner ${isSelected ? 'bg-white/20 dark:bg-black/10 text-white dark:text-zinc-900' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-600'}`}>
                                                        {isSelected ? <CheckCircle2 className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                                                    </div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wide leading-tight ${isSelected ? 'text-white dark:text-zinc-900' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white'}`}>
                                                        {cat}
                                                    </span>
                                                </div>
                                            </button>
                                        )})}
                                    </div>
                                    {selectedCats.length < 3 && (
                                        <div className="flex items-center gap-2 mt-3 text-red-600 dark:text-red-400">
                                            <AlertCircle className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-wide">En az 3 kategori seçilmelidir ({selectedCats.length}/3)</span>
                                        </div>
                                    )}
                                    {selectedCats.length >= 3 && (
                                        <div className="flex items-center gap-2 mt-3 text-green-600 dark:text-green-400">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-wide">{selectedCats.length} kategori seçildi ✓</span>
                                        </div>
                                    )}
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-3 block">SON ÇÖZÜLME TARİHİ (OPSİYONEL)</label>
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-600 rounded-2xl px-6 py-4 text-sm font-bold transition-all outline-none text-zinc-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-red-600/30 active:scale-[0.98] mt-4"
                            >
                                {loading ? "OLUŞTURULUYOR..." : "ATAMAYI YAYINLA"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function X({ size, className }: { size?: number, className?: string }) {
    return (
        <svg
            width={size || 24}
            height={size || 24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6L6 18M6 6l12 12" />
        </svg>
    );
}
