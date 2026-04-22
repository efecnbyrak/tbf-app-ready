"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, Trophy, Calendar, MapPin, Clock, Users, Briefcase, HeartPulse, BarChart3, Eye, ChevronLeft, Loader2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { MatchData } from "@/lib/match-parser";

const OFFICIAL_TYPE_LABELS: Record<string, string> = {
    TABLE: "Masa Görevlisi",
    OBSERVER: "Gözlemci",
    HEALTH: "Sağlıkçı",
    STATISTICIAN: "İstatistikçi",
    FIELD_COMMISSIONER: "Saha Komiseri",
    TABLE_STATISTICIAN: "Masa/İstatistikçi",
    TABLE_HEALTH: "Masa/Sağlıkçı",
};

interface UserItem {
    id: number;
    firstName: string;
    lastName: string;
    imageUrl: string | null;
    isOfficial: boolean;
    officialType: string | null;
    classification: string | null;
    matchCount: number;
    lastSync: string | null;
}

interface UserMatchesClientProps {
    users: UserItem[];
}

const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const TR_DAYS = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];

function parseTurkishDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/);
    if (match) {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
}

function formatDateTR(dateStr: string): string {
    const d = parseTurkishDate(dateStr);
    if (!d) return dateStr;
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()} ${TR_DAYS[d.getDay()]}`;
}

function formatSyncDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function normalizeTR(s: string): string {
    return s.replace(/İ/g,"i").replace(/I/g,"ı").replace(/Ğ/g,"ğ")
            .replace(/Ü/g,"ü").replace(/Ş/g,"ş").replace(/Ö/g,"ö").replace(/Ç/g,"ç")
            .toLowerCase().trim();
}

function getRoleInMatch(m: MatchData, firstName: string, lastName: string): string {
    const fullName = normalizeTR(`${firstName} ${lastName}`);
    const check = (arr: string[]) => arr.some(n => normalizeTR(n).includes(fullName) || fullName.includes(normalizeTR(n).replace(/\s+/g," ").trim()));
    if (check(m.hakemler)) return "Hakem";
    if (check(m.masa_gorevlileri)) return "Masa Görevlisi";
    if (check(m.saglikcilar)) return "Sağlıkçı";
    if (check(m.istatistikciler)) return "İstatistikçi";
    if (check(m.gozlemciler)) return "Gözlemci";
    if (check(m.sahaKomiserleri)) return "Saha Komiseri";
    return "Görevli";
}

const ROLE_COLORS: Record<string, string> = {
    "Hakem": "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
    "Masa Görevlisi": "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    "Sağlıkçı": "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    "İstatistikçi": "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
    "Gözlemci": "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400",
    "Saha Komiseri": "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
    "Görevli": "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
};

function isUpcoming(dateStr: string): boolean {
    const d = parseTurkishDate(dateStr);
    if (!d) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    return d >= today;
}

function MatchCard({ match, firstName, lastName }: { match: MatchData; firstName: string; lastName: string }) {
    const [expanded, setExpanded] = useState(false);
    const role = getRoleInMatch(match, firstName, lastName);
    const upcoming = isUpcoming(match.tarih);

    return (
        <div className={`rounded-2xl border overflow-hidden bg-white dark:bg-zinc-900 shadow-sm transition-all ${
            upcoming ? "border-zinc-200 dark:border-zinc-700" : "border-zinc-100 dark:border-zinc-800 opacity-75"
        }`}>
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full text-left p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 active:bg-zinc-100 transition-colors"
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black ${ROLE_COLORS[role] || ROLE_COLORS["Görevli"]}`}>
                                {role}
                            </span>
                            {upcoming && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                    Yaklaşan
                                </span>
                            )}
                        </div>
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] leading-snug truncate">
                            {match.mac_adi}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 shrink-0" />
                                {formatDateTR(match.tarih)}
                            </span>
                            {match.saat && (
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 shrink-0" />
                                    {match.saat}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="shrink-0 text-zinc-400 mt-1">
                        {expanded
                            ? <ChevronLeft className="w-4 h-4 rotate-90" />
                            : <ChevronLeft className="w-4 h-4 -rotate-90" />
                        }
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 px-4 pb-4 pt-3 space-y-3">
                    {match.salon && (
                        <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                            <span>{match.salon}</span>
                        </div>
                    )}
                    <div className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Trophy className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                        <span>{match.kategori} — {match.ligTuru}</span>
                    </div>

                    {match.hakemler.length > 0 && (
                        <PersonnelRow icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Hakemler" names={match.hakemler} highlight={`${firstName} ${lastName}`} />
                    )}
                    {match.masa_gorevlileri.length > 0 && (
                        <PersonnelRow icon={<Briefcase className="w-3.5 h-3.5" />} label="Masa" names={match.masa_gorevlileri} highlight={`${firstName} ${lastName}`} />
                    )}
                    {match.gozlemciler.length > 0 && (
                        <PersonnelRow icon={<Eye className="w-3.5 h-3.5" />} label="Gözlemci" names={match.gozlemciler} highlight={`${firstName} ${lastName}`} />
                    )}
                    {match.saglikcilar.length > 0 && (
                        <PersonnelRow icon={<HeartPulse className="w-3.5 h-3.5" />} label="Sağlık" names={match.saglikcilar} highlight={`${firstName} ${lastName}`} />
                    )}
                    {match.istatistikciler.length > 0 && (
                        <PersonnelRow icon={<BarChart3 className="w-3.5 h-3.5" />} label="İstatistik" names={match.istatistikciler} highlight={`${firstName} ${lastName}`} />
                    )}
                </div>
            )}
        </div>
    );
}

function PersonnelRow({ icon, label, names, highlight }: { icon: React.ReactNode; label: string; names: string[]; highlight: string }) {
    const fullHighlight = normalizeTR(highlight);
    return (
        <div className="flex items-start gap-2 text-sm">
            <span className="text-zinc-400 shrink-0 mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
                <span className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wide mr-2">{label}</span>
                {names.map((n, i) => {
                    const isMe = normalizeTR(n).includes(fullHighlight.split(" ")[0]) && normalizeTR(n).includes(fullHighlight.split(" ")[1] || "");
                    return (
                        <span key={i} className={`inline-block mr-1.5 ${isMe ? "font-bold text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}>
                            {n}{i < names.length - 1 ? "," : ""}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

export function UserMatchesClient({ users }: UserMatchesClientProps) {
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [matches, setMatches] = useState<MatchData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

    const filtered = useMemo(() => {
        const q = normalizeTR(search);
        if (!q) return users;
        return users.filter(u =>
            normalizeTR(`${u.firstName} ${u.lastName}`).includes(q)
        );
    }, [users, search]);

    async function selectUser(u: UserItem) {
        setSelectedUser(u);
        setMatches([]);
        setError(null);
        setFilter("all");
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/user-matches?userId=${u.id}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Hata");
            const store = data.matchStore as any;
            setMatches(store?.matches || []);
            setLastSync(store?.lastSync || null);
        } catch (e: any) {
            setError(e.message || "Bilinmeyen hata");
        } finally {
            setLoading(false);
        }
    }

    const displayMatches = useMemo(() => {
        if (filter === "upcoming") return matches.filter(m => isUpcoming(m.tarih));
        if (filter === "past") return matches.filter(m => !isUpcoming(m.tarih));
        return matches;
    }, [matches, filter]);

    // Sort: upcoming first, then by date desc for past
    const sortedMatches = useMemo(() => {
        return [...displayMatches].sort((a, b) => {
            const da = parseTurkishDate(a.tarih);
            const db_ = parseTurkishDate(b.tarih);
            if (!da || !db_) return 0;
            const aUp = isUpcoming(a.tarih);
            const bUp = isUpcoming(b.tarih);
            if (aUp && !bUp) return -1;
            if (!aUp && bUp) return 1;
            if (aUp && bUp) return da.getTime() - db_.getTime();
            return db_.getTime() - da.getTime();
        });
    }, [displayMatches]);

    const upcomingCount = useMemo(() => matches.filter(m => isUpcoming(m.tarih)).length, [matches]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 min-h-[70vh]">
            {/* User List */}
            <div className={`flex flex-col gap-3 ${selectedUser ? "hidden lg:flex" : "flex"}`}>
                {/* Search */}
                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-4 py-3 shadow-sm">
                    <Search className="w-4 h-4 text-zinc-400 shrink-0" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="İsim ile ara..."
                        className="flex-1 bg-transparent text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none font-medium"
                    />
                </div>

                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.15em] px-1">
                    {filtered.length} kullanıcı
                </p>

                <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)] pr-1 modern-scrollbar">
                    {filtered.map(u => (
                        <button
                            key={u.id}
                            onClick={() => selectUser(u)}
                            className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                                selectedUser?.id === u.id
                                    ? "border-red-500 bg-red-50 dark:bg-red-900/10 shadow-sm"
                                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700"
                            }`}
                        >
                            <div className="relative shrink-0">
                                <Image
                                    src={u.imageUrl || "/hakem/defaultHakem.png"}
                                    alt={`${u.firstName} ${u.lastName}`}
                                    width={44}
                                    height={44}
                                    className="rounded-xl object-cover aspect-square"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] leading-snug truncate">
                                    {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5 truncate">
                                    {u.isOfficial
                                        ? OFFICIAL_TYPE_LABELS[u.officialType || ""] || u.officialType
                                        : `Hakem${u.classification ? ` · ${u.classification}` : ""}`
                                    }
                                </p>
                            </div>
                            <div className="shrink-0 text-right">
                                <span className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-xs font-black ${
                                    u.matchCount > 0
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"
                                }`}>
                                    {u.matchCount}
                                </span>
                            </div>
                        </button>
                    ))}

                    {filtered.length === 0 && (
                        <div className="text-center py-10 text-zinc-400">
                            <Users className="w-10 h-10 mx-auto mb-3 opacity-25" />
                            <p className="font-semibold text-sm">Kullanıcı bulunamadı</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Match Panel */}
            <div className={`flex flex-col gap-4 ${!selectedUser ? "hidden lg:flex" : "flex"}`}>
                {!selectedUser ? (
                    <div className="flex-1 flex items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 min-h-64">
                        <div className="text-center text-zinc-400 p-8">
                            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="font-bold text-zinc-500 dark:text-zinc-400">Bir kullanıcı seçin</p>
                            <p className="text-sm mt-1">Maçlarını görüntülemek için soldaki listeden seçin</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
                            {/* Back on mobile */}
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="lg:hidden shrink-0 flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 active:scale-95 transition-all"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <Image
                                src={selectedUser.imageUrl || "/hakem/defaultHakem.png"}
                                alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                                width={48}
                                height={48}
                                className="rounded-xl object-cover aspect-square shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="font-black text-zinc-900 dark:text-zinc-100 text-base leading-snug truncate">
                                    {selectedUser.firstName} {selectedUser.lastName}
                                </p>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                    {selectedUser.isOfficial
                                        ? OFFICIAL_TYPE_LABELS[selectedUser.officialType || ""] || selectedUser.officialType
                                        : `Hakem${selectedUser.classification ? ` · ${selectedUser.classification}` : ""}`
                                    }
                                    {lastSync && (
                                        <span className="ml-2 opacity-60">· Son sync: {formatSyncDate(lastSync)}</span>
                                    )}
                                </p>
                            </div>
                            <div className="shrink-0">
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-black">
                                    <Trophy className="w-3.5 h-3.5" />
                                    {matches.length}
                                </span>
                            </div>
                        </div>

                        {/* Filter tabs */}
                        {!loading && !error && matches.length > 0 && (
                            <div className="flex gap-2">
                                {(["all", "upcoming", "past"] as const).map(f => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                                            filter === f
                                                ? "bg-red-600 text-white shadow-sm"
                                                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300"
                                        }`}
                                    >
                                        {f === "all" ? `Tümü (${matches.length})` : f === "upcoming" ? `Yaklaşan (${upcomingCount})` : `Geçmiş (${matches.length - upcomingCount})`}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                                <span className="ml-3 text-zinc-500 font-semibold">Maçlar yükleniyor...</span>
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center py-20 gap-3 text-red-500">
                                <AlertCircle className="w-6 h-6 shrink-0" />
                                <p className="font-semibold">{error}</p>
                            </div>
                        ) : matches.length === 0 ? (
                            <div className="text-center py-16 text-zinc-400">
                                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p className="font-bold text-zinc-500 text-base">Maç kaydı yok</p>
                                <p className="text-sm mt-2">Bu kullanıcı için henüz maç verisi senkronize edilmemiş.</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-340px)] pr-1 modern-scrollbar">
                                {sortedMatches.map((m, i) => (
                                    <MatchCard
                                        key={i}
                                        match={m}
                                        firstName={selectedUser.firstName}
                                        lastName={selectedUser.lastName}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
