"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Trophy, Calendar, MapPin, Navigation, Users, Briefcase, HeartPulse, BarChart3, Eye, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw, Clock, CheckCircle2, CalendarDays, Layers, Archive, Search, Download, FileSpreadsheet, PieChart } from "lucide-react";
import type * as ExcelJS from "exceljs";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { MatchData } from "@/lib/match-parser";

interface MatchesClientProps {
    firstName: string;
    lastName: string;
    initialMatches?: MatchData[];
    initialLastSync?: string | null;
    initialPersonnelPhones?: Record<string, string>;
}

function getGoogleMapsUrl(salonName: string): string {
    const query = encodeURIComponent(salonName + " İstanbul");
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

function normalizeTR(name: string): string {
    return name
        .replace(/İ/g, "i").replace(/I/g, "ı")
        .replace(/Ğ/g, "ğ").replace(/Ü/g, "ü")
        .replace(/Ş/g, "ş").replace(/Ö/g, "ö")
        .replace(/Ç/g, "ç")
        .toLowerCase().replace(/\s+/g, " ").trim();
}

function nameMatchesClient(cellName: string, firstName: string, lastName: string): boolean {
    if (!cellName || cellName.length < 3) return false;
    const n = normalizeTR(cellName);
    const fN = normalizeTR(firstName);
    const lN = normalizeTR(lastName);
    if (n.includes(fN) && n.includes(lN)) return true;
    const target = normalizeTR(`${firstName} ${lastName}`);
    if (n === target || n.includes(target)) return true;
    return false;
}

function parseTurkishDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const match = dateStr.match(/(\d{1,2})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{4})/);
    if (match) {
        const [, day, month, year] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
}

function matchKey(m: MatchData): string {
    const norm = (s: string) => (s || "").replace(/\s+/g, " ").trim().toLowerCase();
    const hakems = [...m.hakemler].map(norm).sort().join(",");
    const masa = [...m.masa_gorevlileri].map(norm).sort().join(",");
    return `${norm(m.mac_adi)}|${norm(m.tarih)}|${norm(m.saat || "")}|${norm(m.salon || "")}|${hakems}|${masa}`;
}

function dedupeMatches(matches: MatchData[]): MatchData[] {
    const seen = new Set<string>();
    return matches.filter(m => {
        const key = matchKey(m);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function formatDisplayDate(dateStr: string): string {
    const d = parseTurkishDate(dateStr);
    if (!d) return dateStr || "";
    return format(d, "d MMMM yyyy EEEE", { locale: tr });
}

const ROLE_CONFIG = {
    hakem: { label: "Hakem", color: "from-red-500 to-red-700", bg: "bg-red-500/10", text: "text-red-600", icon: Trophy },
    masa: { label: "Masa Görevlisi", color: "from-blue-500 to-blue-700", bg: "bg-blue-500/10", text: "text-blue-600", icon: Briefcase },
    saglik: { label: "Sağlıkçı", color: "from-emerald-500 to-emerald-700", bg: "bg-emerald-500/10", text: "text-emerald-600", icon: HeartPulse },
    istatistik: { label: "İstatistikçi", color: "from-violet-500 to-violet-700", bg: "bg-violet-500/10", text: "text-violet-600", icon: BarChart3 },
    gozlemci: { label: "Gözlemci", color: "from-amber-500 to-amber-700", bg: "bg-amber-500/10", text: "text-amber-600", icon: Eye },
    default: { label: "Görevli", color: "from-zinc-500 to-zinc-700", bg: "bg-zinc-500/10", text: "text-zinc-600", icon: Users },
};

type FilterMode = "all" | "played" | "upcoming" | "okul" | "ozel" | "hafta";

export function MatchesClient({ firstName, lastName, initialMatches = [], initialLastSync = null, initialPersonnelPhones = {} }: MatchesClientProps) {
    const [allMatches, setAllMatches] = useState<MatchData[]>(() => dedupeMatches(initialMatches));
    const [personnelPhones, setPersonnelPhones] = useState<Record<string, string>>(initialPersonnelPhones);
    const [loading, setLoading] = useState(initialMatches.length === 0);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshSuccess, setRefreshSuccess] = useState(false);
    const [error, setError] = useState("");
    const [filterMode, setFilterMode] = useState<FilterMode>("all");
    const [selectedHafta, setSelectedHafta] = useState<number | null>(null);
    const [expandedMatch, setExpandedMatch] = useState<number | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(initialLastSync);
    const [fromCache, setFromCache] = useState(initialMatches.length > 0);
    const [visibleCount, setVisibleCount] = useState(30);
    const filterSectionRef = useRef<HTMLDivElement>(null);

    // Archive scanning state
    const [archiveStatus, setArchiveStatus] = useState<string>("");
    const [archiveScanning, setArchiveScanning] = useState(false);
    const [archiveComplete, setArchiveComplete] = useState(false);
    const archiveScanRef = useRef(false);
    const backgroundRefreshRef = useRef(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState("");

    // Download modal states
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [downloading, setDownloading] = useState(false);

    // ============================================================
    // Load matches (current season)
    // ============================================================
    const loadMatches = useCallback(async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshing(true);
            // Don't reset archiveScanRef — server handles which seasons need re-scanning
            // Old seasons stay cached, only current season archive is re-scanned
        } else {
            // Only show full-page loading if we truly have NO cached data
            setLoading((prevMatches: boolean | ((prevState: boolean) => boolean)) => {
                // We use functional update or check current length.
                // But inside useCallback without allMatches dependency, we can't safely read allMatches directly unless we add it.
                // However, since loadMatches is called on mount, if initialMatches > 0, loading is already false.
                return false;
            });
            // Actually, we can just check if we need to load at all. 
            // The useEffect handles the first load. If we have initialMatches, we ALREADY triggered backgroundRefreshRef in the constructor basically? No.
        }
        setError("");

        try {
            const url = forceRefresh ? "/api/matches?refresh=true" : "/api/matches";
            const res = await fetch(url);
            const data = await res.json();

            if (res.ok) {
                setAllMatches(dedupeMatches(data.matches || []));
                setLastSync(data.lastSync || null);
                setFromCache(data.fromCache || false);
                if (data.personnelPhones) {
                    setPersonnelPhones(data.personnelPhones);
                }

                // Trigger archive scan if there are pending seasons
                if (data.pendingSeasons && data.pendingSeasons.length > 0 && !archiveScanRef.current) {
                    archiveScanRef.current = true;
                    scanArchiveSeasons(data.pendingSeasons);
                } else if (!data.pendingSeasons || data.pendingSeasons.length === 0) {
                    setArchiveComplete(true);
                }

                // AUTO-REFRESH: If data came from cache, trigger background refresh
                // User sees cached data instantly while fresh data loads silently
                if (data.fromCache && !forceRefresh && !backgroundRefreshRef.current) {
                    backgroundRefreshRef.current = true;
                    triggerBackgroundRefresh();
                }
            } else {
                setError(data.error || "Maç verileri yüklenemedi.");
            }
        } catch (e: any) {
            setError("Bağlantı hatası. Lütfen tekrar deneyin.");
        } finally {
            if (!forceRefresh) {
                setLoading(false);
            }
            if (forceRefresh) {
                setRefreshing(false);
                setRefreshSuccess(true);
                setTimeout(() => setRefreshSuccess(false), 3500);
            }
        }
    }, []);

    // ============================================================
    // Scan archive seasons one by one
    // ============================================================
    const scanArchiveSeasons = useCallback(async (seasons: string[]) => {
        setArchiveScanning(true);

        for (let i = 0; i < seasons.length; i++) {
            const season = seasons[i];
            setArchiveStatus(`Arşiv taranıyor: ${season} (${i + 1}/${seasons.length})`);

            try {
                const res = await fetch(`/api/matches?season=${encodeURIComponent(season)}`);
                const data = await res.json();

                if (res.ok && data.matches) {
                    setAllMatches(dedupeMatches(data.matches));
                    if (data.newMatchesFound > 0) {
                        setLastSync(data.lastSync);
                    }
                }
            } catch (e) {
                console.error(`Archive scan error for ${season}:`, e);
            }
        }

        setArchiveScanning(false);
        setArchiveComplete(true);
        setArchiveStatus("");
    }, []);

    // ============================================================
    // Background refresh — silently update when loading from cache
    // ============================================================
    const triggerBackgroundRefresh = useCallback(async () => {
        try {
            setRefreshing(true); // Show the refresh indicator to the user
            // Silently refresh current season
            const res = await fetch("/api/matches?refresh=true");
            const data = await res.json();

            if (res.ok && data.matches) {
                setAllMatches(dedupeMatches(data.matches));
                setLastSync(data.lastSync);
                setFromCache(false);
                if (data.personnelPhones) {
                    setPersonnelPhones(data.personnelPhones);
                }

                // After current season refresh, scan archive too
                if (data.pendingSeasons && data.pendingSeasons.length > 0) {
                    archiveScanRef.current = true;
                    scanArchiveSeasons(data.pendingSeasons);
                }
            }
        } catch (e) {
            console.error("Background refresh failed:", e);
        } finally {
            setRefreshing(false);
        }
    }, [scanArchiveSeasons]);

    // On mount, if we received initial matches from the server, we should trigger the background refresh immediately!
    useEffect(() => {
        if (initialMatches && initialMatches.length > 0 && !backgroundRefreshRef.current) {
            backgroundRefreshRef.current = true;
            triggerBackgroundRefresh();
        } else if (!initialMatches || initialMatches.length === 0) {
            loadMatches();
        }
    }, [loadMatches, initialMatches, triggerBackgroundRefresh]);

    // ============================================================
    // Computed values
    // ============================================================
    const getRole = useCallback((match: MatchData) => {
        const check = (arr: string[]) => arr.some(n => nameMatchesClient(n, firstName, lastName));
        if (check(match.hakemler)) return ROLE_CONFIG.hakem;
        if (check(match.masa_gorevlileri)) return ROLE_CONFIG.masa;
        if (check(match.saglikcilar)) return ROLE_CONFIG.saglik;
        if (check(match.istatistikciler)) return ROLE_CONFIG.istatistik;
        if (check(match.gozlemciler)) return ROLE_CONFIG.gozlemci;
        return ROLE_CONFIG.default;
    }, [firstName, lastName]);

    // Computed values computed dynamically directly instead of stale memo


    const checkIsPast = useCallback((tarih: string, saat?: string) => {
        const matchDate = parseTurkishDate(tarih);
        if (!matchDate) return true;

        const nowFull = new Date();
        const nowStartOfDay = new Date();
        nowStartOfDay.setHours(0, 0, 0, 0);

        if (matchDate < nowStartOfDay) return true;
        if (matchDate > nowStartOfDay) return false;

        if (saat) {
            const parts = saat.split(/[:.]/);
            if (parts.length >= 2) {
                const matchTime = new Date(nowStartOfDay);
                matchTime.setHours(parseInt(parts[0], 10) + 1, parseInt(parts[1], 10), 0, 0);
                return nowFull > matchTime;
            }
        }
        return false;
    }, []);

    const { playedMatches, upcomingMatches, okulMatches, ozelMatches, haftaGroups } = useMemo(() => {
        const played: MatchData[] = [];
        const upcoming: MatchData[] = [];
        const okul: MatchData[] = [];
        const ozel: MatchData[] = [];
        const haftaMap: Record<number, MatchData[]> = {};

        for (const m of allMatches) {
            if (checkIsPast(m.tarih, m.saat)) {
                played.push(m);
            } else {
                upcoming.push(m);
            }
            if (m.ligTuru === "OKUL İL VE İLÇE") okul.push(m);
            if (m.ligTuru === "ÖZEL LİG VE ÜNİVERSİTE") ozel.push(m);
            if (m.hafta) {
                if (!haftaMap[m.hafta]) haftaMap[m.hafta] = [];
                haftaMap[m.hafta].push(m);
            }
        }

        return {
            playedMatches: played,
            upcomingMatches: upcoming,
            okulMatches: okul,
            ozelMatches: ozel,
            haftaGroups: { map: haftaMap, sortedWeeks: Object.keys(haftaMap).map(Number).sort((a, b) => a - b) },
        };
    }, [allMatches, checkIsPast]);

    // Statistics computation
    const stats = useMemo(() => {
        const total = allMatches.length;
        if (total === 0) return null;

        const check = (arr: string[]) => arr.some(n => nameMatchesClient(n, firstName, lastName));

        const roleCount = { hakem: 0, masa: 0, saglik: 0, istatistik: 0, gozlemci: 0 };
        const ligCount: Record<string, number> = {};

        for (const m of allMatches) {
            // Role counting
            if (check(m.hakemler)) roleCount.hakem++;
            else if (check(m.masa_gorevlileri)) roleCount.masa++;
            else if (check(m.saglikcilar)) roleCount.saglik++;
            else if (check(m.istatistikciler)) roleCount.istatistik++;
            else if (check(m.gozlemciler)) roleCount.gozlemci++;

            // League counting
            const lig = m.ligTuru || "Diğer";
            ligCount[lig] = (ligCount[lig] || 0) + 1;
        }

        const roles = [
            { key: "hakem", label: "Hakem", count: roleCount.hakem, color: "bg-red-500", textColor: "text-red-600" },
            { key: "masa", label: "Masa Görevlisi", count: roleCount.masa, color: "bg-blue-500", textColor: "text-blue-600" },
            { key: "saglik", label: "Sağlıkçı", count: roleCount.saglik, color: "bg-emerald-500", textColor: "text-emerald-600" },
            { key: "istatistik", label: "İstatistikçi", count: roleCount.istatistik, color: "bg-violet-500", textColor: "text-violet-600" },
            { key: "gozlemci", label: "Gözlemci", count: roleCount.gozlemci, color: "bg-amber-500", textColor: "text-amber-600" },
        ].filter(r => r.count > 0);

        const ligs = Object.entries(ligCount)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count);

        const playedPercent = total > 0 ? Math.round((playedMatches.length / total) * 100) : 0;

        return { total, roles, ligs, playedPercent };
    }, [allMatches, playedMatches, firstName, lastName]);

    const filteredMatches = useMemo(() => {
        let baseList = allMatches;
        switch (filterMode) {
            case "played": baseList = playedMatches; break;
            case "upcoming": baseList = upcomingMatches; break;
            case "okul": baseList = okulMatches; break;
            case "ozel": baseList = ozelMatches; break;
            case "hafta":
                baseList = selectedHafta && haftaGroups.map[selectedHafta] ? haftaGroups.map[selectedHafta] : [];
                break;
        }

        let filteredList = baseList;
        if (searchQuery.trim()) {
            const q = normalizeTR(searchQuery);
            filteredList = baseList.filter(m => {
                return normalizeTR(m.mac_adi).includes(q) ||
                    normalizeTR(m.salon || "").includes(q) ||
                    normalizeTR(m.ligTuru).includes(q) ||
                    (m.kaynak_dosya && normalizeTR(m.kaynak_dosya).includes(q));
            });
        }

        // Sort descending by date and time
        return filteredList.sort((a, b) => {
            const dateA = parseTurkishDate(a.tarih);
            const dateB = parseTurkishDate(b.tarih);

            const timeA = dateA ? dateA.getTime() : 0;
            const timeB = dateB ? dateB.getTime() : 0;

            if (timeA !== timeB) {
                return timeB - timeA; // Descending by date
            }

            // Same date, sort by time (saat)
            const saatA = a.saat || "00:00";
            const saatB = b.saat || "00:00";

            // Compare HH:mm strings directly (e.g. "12:00" > "10:00")
            // Reversing the comparison makes it descending (latest time first)
            if (saatA > saatB) return -1;
            if (saatA < saatB) return 1;
            return 0;
        });
    }, [filterMode, selectedHafta, allMatches, playedMatches, upcomingMatches, okulMatches, ozelMatches, haftaGroups, searchQuery]);

    const visibleMatches = useMemo(() => filteredMatches.slice(0, visibleCount), [filteredMatches, visibleCount]);

    useEffect(() => { setVisibleCount(30); setExpandedMatch(null); }, [filterMode, selectedHafta, searchQuery]);

    const lastSyncDisplay = useMemo(() => {
        if (!lastSync) return null;
        try {
            return new Date(lastSync).toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
        } catch { return null; }
    }, [lastSync]);

    // Mobile-only: clicking stat card sets filter and scrolls to filter section
    const handleStatCardClick = useCallback((mode: FilterMode) => {
        if (typeof window !== "undefined" && window.innerWidth >= 640) return;
        setFilterMode(mode);
        if (mode === "hafta" && !selectedHafta && haftaGroups.sortedWeeks.length > 0) {
            setSelectedHafta(haftaGroups.sortedWeeks[haftaGroups.sortedWeeks.length - 1]);
        }
        setTimeout(() => {
            filterSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }, [selectedHafta, haftaGroups.sortedWeeks]);

    // ============================================================
    // Excel Download Logic
    // ============================================================
    const handleDownloadExcel = async (downloadAll = false) => {
        let matchesToExport = allMatches;

        if (!downloadAll) {
            if (!startDate || !endDate) {
                alert("Lütfen başlangıç ve bitiş tarihlerini seçin veya 'Tümünü İndir' butonunu kullanın.");
                return;
            }

            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);

            matchesToExport = allMatches.filter(m => {
                const mDate = parseTurkishDate(m.tarih);
                if (!mDate) return false;
                return mDate >= start && mDate <= end;
            });
        }

        // Sort descending by date and time (newest first)
        matchesToExport = [...matchesToExport].sort((a, b) => {
            const dateA = parseTurkishDate(a.tarih);
            const dateB = parseTurkishDate(b.tarih);

            if (!dateA && !dateB) return 0;
            if (!dateA) return 1;
            if (!dateB) return -1;

            // Add time to date if available
            if (a.saat && a.saat.includes(':')) {
                const [h, m] = a.saat.split(':');
                if (!isNaN(parseInt(h)) && !isNaN(parseInt(m))) {
                    dateA.setHours(parseInt(h), parseInt(m));
                }
            }
            if (b.saat && b.saat.includes(':')) {
                const [h, m] = b.saat.split(':');
                if (!isNaN(parseInt(h)) && !isNaN(parseInt(m))) {
                    dateB.setHours(parseInt(h), parseInt(m));
                }
            }

            return dateB.getTime() - dateA.getTime();
        });

        if (matchesToExport.length === 0) {
            alert("Seçilen kriterlere uygun maçınız bulunmamaktadır.");
            setDownloadModalOpen(false);
            return;
        }

        setDownloading(true);

        try {
            const ExcelJS = await import("exceljs");
            const workbook = new ExcelJS.Workbook();
            workbook.creator = "BKS Sistem";
            workbook.lastModifiedBy = "BKS Sistem";
            workbook.created = new Date();
            workbook.modified = new Date();

            const createSheet = (sheetName: string, matches: MatchData[]) => {
                if (matches.length === 0) return;

                // Max 31 chars for sheet name
                const safeName = sheetName.substring(0, 31).replace(/[\\/*?[\]]/g, '');
                const sheet = workbook.addWorksheet(safeName);

                const hasHakem3 = matches.some(m => m.hakemler && m.hakemler.length >= 3);
                const isOkulSheet = sheetName === "Okul İl ve İlçe" || matches.every(m => m.ligTuru === "OKUL İL VE İLÇE");

                const columns: Partial<ExcelJS.Column>[] = [
                    { header: "Tarih", key: "tarih", width: 25 },
                    { header: "Saat", key: "saat", width: 10 },
                    { header: "Salon", key: "salon", width: 40 },
                    { header: "Kategori/Lig", key: "lig", width: 25 },
                    { header: "İlçe", key: "ilce", width: 30 },
                    { header: "A Takımı", key: "a_takimi", width: 35 },
                    { header: "B Takımı", key: "b_takimi", width: 35 }
                ];

                columns.push(
                    { header: "Görevim", key: "gorev", width: 18 },
                    { header: "1. Hakem", key: "hakem1", width: 25 },
                    { header: "2. Hakem", key: "hakem2", width: 25 }
                );

                if (hasHakem3) columns.push({ header: "3. Hakem", key: "hakem3", width: 25 });

                columns.push(
                    { header: "Masa Görevlisi 1", key: "masa1", width: 25 },
                    { header: "Masa Görevlisi 2", key: "masa2", width: 25 },
                    { header: "Masa Görevlisi 3", key: "masa3", width: 25 },
                    { header: "İstatistikçi", key: "istatistik", width: 20 },
                    { header: "Sağlıkçı", key: "saglik", width: 20 },
                    { header: "Gözlemci", key: "gozlem", width: 20 }
                );

                sheet.columns = columns;

                // Header styling
                sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
                sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };

                const MONTH_NAMES_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
                let lastMonthYear = "";

                matches.forEach((m) => {
                    // Try to insert monthly separators if enabled (only for "Tümü" or generic sheets, not for single month sheets)
                    const mDate = parseTurkishDate(m.tarih);
                    if (mDate && (sheetName === "Tümü" || sheetName.includes("Okul") || sheetName.includes("Özel"))) {
                        const mYear = mDate.getFullYear();
                        const mMonth = mDate.getMonth();
                        const currentMonthYear = `${MONTH_NAMES_TR[mMonth]} ${mYear}`;
                        
                        if (currentMonthYear !== lastMonthYear) {
                            const sepRow = sheet.addRow([currentMonthYear]);
                            sheet.mergeCells(sheet.rowCount, 1, sheet.rowCount, columns.length);
                            sepRow.font = { bold: true, size: 14, color: { argb: "FFDC2626" } };
                            sepRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF0F2" } };
                            sepRow.alignment = { vertical: "middle", horizontal: "center" };
                            lastMonthYear = currentMonthYear;
                        }
                    }

                    const roleObj = getRole(m);

                    const cleanName = (name: string) => name ? name.trim() : "-";
                    const hakem1 = m.hakemler[0] ? cleanName(m.hakemler[0]) : "-";
                    const hakem2 = m.hakemler[1] ? cleanName(m.hakemler[1]) : "-";
                    const hakem3 = m.hakemler[2] ? cleanName(m.hakemler[2]) : "-";

                    const masa1 = m.masa_gorevlileri[0] ? cleanName(m.masa_gorevlileri[0]) : "-";
                    const masa2 = m.masa_gorevlileri[1] ? cleanName(m.masa_gorevlileri[1]) : "-";
                    const masa3 = m.masa_gorevlileri[2] ? cleanName(m.masa_gorevlileri[2]) : "-";

                    let aTakimi = "-";
                    let bTakimi = "-";
                    let ilce = "-";

                    const isOkulMatch = m.ligTuru === "OKUL İL VE İLÇE";

                    if (isOkulMatch) {
                        let macAdi = m.mac_adi;

                        // Default ilce to the whole name if it contains ILCE
                        if (macAdi.toUpperCase().includes("İLÇE") || macAdi.toUpperCase().includes("ILCE")) {
                            ilce = macAdi;
                        }

                        // Try to split if there are hyphens
                        if (macAdi.includes("-")) {
                            const parts = macAdi.split("-").map(p => p.trim());

                            // Check if any part has "ilçe" to isolate it
                            const ilceIndex = parts.findIndex(p => p.toUpperCase().includes("İLÇE") || p.toUpperCase().includes("ILCE"));
                            if (ilceIndex !== -1) {
                                ilce = parts[ilceIndex];
                                parts.splice(ilceIndex, 1);

                                // Re-evaluate teams with remaining parts
                                if (parts.length >= 2) {
                                    aTakimi = parts[0];
                                    bTakimi = parts.slice(1).join("-").trim();
                                } else if (parts.length === 1) {
                                    // If only one part remains and it's a school match, keep A/B empty 
                                    aTakimi = "-";
                                    bTakimi = "-";
                                }
                            } else {
                                // Has hyphens but no "ilçe" explicitly, still split A and B
                                aTakimi = parts[0];
                                bTakimi = parts.slice(1).join("-").trim();
                            }
                        } else {
                            // No hyphens at all, keep A and B empty
                            aTakimi = "-";
                            bTakimi = "-";
                        }
                    } else if (m.mac_adi.includes("-")) {
                        const parts = m.mac_adi.split("-");
                        aTakimi = parts[0].trim();
                        bTakimi = parts.slice(1).join("-").trim();
                    } else {
                        aTakimi = m.mac_adi;
                    }

                    const rowData: any = {
                        tarih: formatDisplayDate(m.tarih),
                        saat: m.saat || "-",
                        salon: m.salon || "-",
                        lig: m.ligTuru,
                        ilce: ilce,
                        a_takimi: aTakimi,
                        b_takimi: bTakimi,
                        gorev: roleObj.label,
                        hakem1: hakem1,
                        hakem2: hakem2,
                        masa1: masa1,
                        masa2: masa2,
                        masa3: masa3,
                        istatistik: m.istatistikciler.join(", ") || "-",
                        saglik: m.saglikcilar.join(", ") || "-",
                        gozlem: m.gozlemciler.join(", ") || "-"
                    };

                    if (hasHakem3) rowData.hakem3 = hakem3;

                    const row = sheet.addRow(rowData);

                    row.alignment = { vertical: "middle", wrapText: false };

                    // Zebra styling
                    if (sheet.rowCount % 2 === 0) {
                        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                    }
                });
            };

            // 1. Tümü
            createSheet("Tümü", matchesToExport);

            // 2. Ödemeler
            {
                const odemSheet = workbook.addWorksheet("Ödemeler");
                odemSheet.columns = [
                    { header: "Tarih", key: "tarih", width: 22 },
                    { header: "Saat", key: "saat", width: 10 },
                    { header: "Maç", key: "mac", width: 40 },
                    { header: "Salon", key: "salon", width: 30 },
                    { header: "Kategori / Lig", key: "lig", width: 25 },
                    { header: "Hafta", key: "hafta", width: 10 },
                    { header: "Görevim", key: "gorev", width: 22 },
                    { header: "Ücret (₺)", key: "ucret", width: 14 },
                    { header: "Ödendi mi?", key: "odendi", width: 14 },
                    { header: "Notlar", key: "notlar", width: 30 },
                ];

                // Header styling
                const hRow = odemSheet.getRow(1);
                hRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
                hRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } };
                hRow.alignment = { vertical: "middle", horizontal: "center" };

                // Sort ascending by date for payment tracking (oldest first)
                const paymentMatches = [...matchesToExport].sort((a, b) => {
                    const dA = parseTurkishDate(a.tarih);
                    const dB = parseTurkishDate(b.tarih);
                    if (!dA && !dB) return 0;
                    if (!dA) return 1;
                    if (!dB) return -1;
                    return dA.getTime() - dB.getTime();
                });

                paymentMatches.forEach((m, i) => {
                    const roleObj = getRole(m);
                    const row = odemSheet.addRow({
                        tarih: formatDisplayDate(m.tarih),
                        saat: m.saat || "-",
                        mac: m.mac_adi,
                        salon: m.salon || "-",
                        lig: m.ligTuru,
                        hafta: m.hafta ? `${m.hafta}. Hafta` : "-",
                        gorev: roleObj.label,
                        ucret: "",
                        odendi: "",
                        notlar: "",
                    });
                    row.alignment = { vertical: "middle", wrapText: false };
                    if ((i + 1) % 2 === 0) {
                        row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };
                    }
                    // Style the Ücret and Ödendi cells for easy fill-in
                    const ucretCell = row.getCell("ucret");
                    ucretCell.alignment = { vertical: "middle", horizontal: "center" };
                    const odendiCell = row.getCell("odendi");
                    odendiCell.alignment = { vertical: "middle", horizontal: "center" };
                });

                // Add borders
                odemSheet.eachRow((row) => {
                    row.eachCell(cell => {
                        cell.border = {
                            top: { style: "thin" },
                            left: { style: "thin" },
                            bottom: { style: "thin" },
                            right: { style: "thin" },
                        };
                    });
                });
            }

            // Group by Week (TBF Leagues)
            const haftaMap: Record<number, MatchData[]> = {};
            matchesToExport.forEach(m => {
                if (m.hafta) {
                    if (!haftaMap[m.hafta]) haftaMap[m.hafta] = [];
                    haftaMap[m.hafta].push(m);
                }
            });

            // 2. Hafta Sheets
            Object.keys(haftaMap).map(Number).sort((a, b) => a - b).forEach(w => {
                createSheet(`${w}. Hafta`, haftaMap[w]);
            });

            // 3. Okul
            const okul = matchesToExport.filter(m => m.ligTuru === "OKUL İL VE İLÇE");
            createSheet("Okul İl ve İlçe", okul);

            // 4. Özel
            const ozel = matchesToExport.filter(m => m.ligTuru === "ÖZEL LİG VE ÜNİVERSİTE");
            createSheet("Özel Lig ve Üni", ozel);

            // 5. Monthly Grouping (Ocak - Aralık) Month+Year
            const MONTH_NAMES_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
            const monthMap: Record<string, MatchData[]> = {};
            matchesToExport.forEach(m => {
                const mDate = parseTurkishDate(m.tarih);
                if (mDate) {
                    const monthIdx = mDate.getMonth(); // 0-11
                    const year = mDate.getFullYear();
                    const key = `${year}-${monthIdx.toString().padStart(2, '0')}`;
                    if (!monthMap[key]) monthMap[key] = [];
                    monthMap[key].push(m);
                }
            });

            // Create sheets for each Year/Month combo in calendar order
            const sortedMonthKeys = Object.keys(monthMap).sort((a, b) => b.localeCompare(a)); // Descending: Newest month first
            for (const key of sortedMonthKeys) {
                if (monthMap[key] && monthMap[key].length > 0) {
                    const [y, mStr] = key.split('-');
                    const targetMonthName = MONTH_NAMES_TR[parseInt(mStr, 10)];
                    createSheet(`${targetMonthName} ${y}`, monthMap[key]);
                }
            }

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const fileNameDate = downloadAll ? "tum_zamanlar" : `${startDate}_${endDate}`;
            a.download = `mac_listem_${fileNameDate}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);

            setDownloadModalOpen(false);
        } catch (e) {
            console.error("Excel generation error:", e);
            alert("İndirme sırasında bir hata oluştu.");
        } finally {
            setDownloading(false);
        }
    };

    // ============================================================
    // Loading state
    // ============================================================
    if (loading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Maçlarım</h1>
                        <p className="text-zinc-400 text-xs">{firstName} {lastName}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12">
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
                        <div className="text-center">
                            <p className="text-zinc-700 dark:text-zinc-300 font-bold">Maçlar Yükleniyor</p>
                            <p className="text-zinc-400 text-xs mt-1">Google Drive&apos;dan veriler okunuyor...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================
    // Main render
    // ============================================================
    return (
        <div className="space-y-5">
            {/* Refresh Success Toast */}
            {refreshSuccess && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
                    <div className="flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-600/30 border border-emerald-500/50">
                        <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="font-black text-sm uppercase tracking-tight">Yükleme Başarıyla Tamamlandı</p>
                            <p className="text-emerald-100 text-xs">Maç verileri güncellendi.</p>
                        </div>
                    </div>
                </div>
            )}
            {/* Header + Search/Export */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                        <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-zinc-900 dark:text-white">Maçlarım</h1>
                        <p className="text-zinc-500 text-[11px] font-bold">
                            {allMatches.length} Maç Bulundu {lastSyncDisplay && <span className="text-zinc-400">- {lastSyncDisplay} tarihinde Son Güncelleme</span>}
                            {fromCache && <span className="ml-1 text-green-500" title="Veri önbellekten hızlı yüklendi">⚡</span>}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Maç, Takım, Salon Ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-red-600 outline-none transition-all dark:text-white"
                        />
                    </div>

                    <button
                        onClick={() => setDownloadModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">Excel İndir</span>
                    </button>

                    <button
                        onClick={() => loadMatches(true)}
                        disabled={refreshing || archiveScanning}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                        <span className="hidden sm:inline">{refreshing ? "Yükleniyor" : "Yenile"}</span>
                    </button>
                </div>
            </div>

            {/* Archive scanning indicator */}
            {archiveScanning && (
                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl flex items-center gap-3">
                    <Archive className="w-5 h-5 text-violet-600 shrink-0 animate-pulse" />
                    <div className="flex-1">
                        <p className="text-violet-700 dark:text-violet-400 text-sm font-bold">{archiveStatus}</p>
                        <p className="text-violet-400 text-xs">Arka planda eski sezonlar taranıyor, sayfayı kapatmayın...</p>
                    </div>
                    <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
                </div>
            )}

            {archiveComplete && !archiveScanning && allMatches.length > 0 && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-emerald-600 text-xs font-medium">Tüm sezonlar tarandı — {allMatches.length} maç bulundu</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-amber-700 dark:text-amber-400 text-sm">{error}</p>
                </div>
            )}

            {/* Stats */}
            {allMatches.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard icon={<Trophy className="w-5 h-5" />} value={allMatches.length} label="Toplam Maç" gradient="from-red-500 to-red-700" onClick={() => handleStatCardClick("all")} />
                    <StatCard icon={<CheckCircle2 className="w-5 h-5" />} value={playedMatches.length} label="Oynanmış" gradient="from-emerald-500 to-emerald-700" />
                    <StatCard icon={<CalendarDays className="w-5 h-5" />} value={upcomingMatches.length} label="Gelecek" gradient="from-blue-500 to-blue-700" onClick={() => handleStatCardClick("upcoming")} />
                    <StatCard icon={<Layers className="w-5 h-5" />} value={haftaGroups.sortedWeeks.length} label="Hafta" gradient="from-violet-500 to-violet-700" onClick={() => handleStatCardClick("hafta")} />
                </div>
            )}

            {/* Detailed Statistics */}
            {stats && allMatches.length > 0 && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                            <PieChart className="w-4 h-4 text-white" />
                        </div>
                        <h2 className="text-lg font-black text-zinc-900 dark:text-white">İstatistiklerim</h2>
                    </div>

                    {/* Played percentage */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Görev Tamamlanma Oranı</span>
                            <span className="text-sm font-black text-emerald-600">{stats.playedPercent}%</span>
                        </div>
                        <div className="w-full h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${stats.playedPercent}%` }} />
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-1.5">{playedMatches.length} / {stats.total} maçta görev tamamlandı</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Role Distribution */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Görev Dağılımı</h3>
                            {stats.roles.map(role => {
                                const pct = Math.round((role.count / stats.total) * 100);
                                return (
                                    <div key={role.key} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-sm font-semibold ${role.textColor}`}>{role.label}</span>
                                            <span className="text-xs font-bold text-zinc-500">{role.count} maç ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className={`h-full ${role.color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* League Distribution */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Lig Dağılımı</h3>
                            {stats.ligs.map(lig => {
                                const pct = Math.round((lig.count / stats.total) * 100);
                                return (
                                    <div key={lig.label} className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate mr-2">{lig.label}</span>
                                            <span className="text-xs font-bold text-zinc-500 shrink-0">{lig.count} maç ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            {allMatches.length > 0 && (
                <div className="space-y-2" ref={filterSectionRef}>
                    <div className="overflow-x-auto pb-1">
                        <div className="flex gap-2 min-w-max">
                            <FilterTab active={filterMode === "all"} onClick={() => setFilterMode("all")} label={`🏀 Tümü (${allMatches.length})`} />
                            <FilterTab active={filterMode === "played"} onClick={() => setFilterMode("played")} label={`✅ Oynanmış (${playedMatches.length})`} />
                            <FilterTab active={filterMode === "upcoming"} onClick={() => setFilterMode("upcoming")} label={`📅 Gelecek (${upcomingMatches.length})`} />
                            {okulMatches.length > 0 && <FilterTab active={filterMode === "okul"} onClick={() => setFilterMode("okul")} label={`🏫 Okul (${okulMatches.length})`} />}
                            {ozelMatches.length > 0 && <FilterTab active={filterMode === "ozel"} onClick={() => setFilterMode("ozel")} label={`🏆 Özel Lig (${ozelMatches.length})`} />}
                            {haftaGroups.sortedWeeks.length > 0 && (
                                <FilterTab active={filterMode === "hafta"} onClick={() => { setFilterMode("hafta"); if (!selectedHafta) setSelectedHafta(haftaGroups.sortedWeeks[haftaGroups.sortedWeeks.length - 1]); }} label={`📋 Hafta (${haftaGroups.sortedWeeks.length})`} />
                            )}
                        </div>
                    </div>

                    {filterMode === "hafta" && (
                        <div className="overflow-x-auto pb-1">
                            <div className="flex gap-1.5 min-w-max">
                                {haftaGroups.sortedWeeks.map(w => (
                                    <button key={w} onClick={() => setSelectedHafta(w)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedHafta === w
                                            ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white shadow-md"
                                            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-300"}`}>
                                        {w}. Hafta ({haftaGroups.map[w].length})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Empty */}
            {allMatches.length === 0 && !error && !archiveScanning && (
                <div className="flex flex-col items-center py-16 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <Trophy className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
                    <h3 className="text-xl font-black text-zinc-600 dark:text-zinc-400">Maç Bulunamadı</h3>
                    <p className="text-zinc-400 text-sm mt-2">&quot;{firstName} {lastName}&quot; ismiyle eşleşen maç kaydı bulunamadı.</p>
                    <button onClick={() => loadMatches(true)} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">
                        Tekrar Dene
                    </button>
                </div>
            )}

            {filteredMatches.length === 0 && allMatches.length > 0 && (
                <div className="flex flex-col items-center py-10 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
                    <Calendar className="w-10 h-10 text-zinc-300 dark:text-zinc-600 mb-3" />
                    <h3 className="text-lg font-bold text-zinc-500">Bu kategoride maç yok</h3>
                </div>
            )}

            {/* Match Cards */}
            {visibleMatches.length > 0 && (
                <div className="space-y-3">
                    {visibleMatches.map((match, idx) => {
                        const role = getRole(match);
                        const RoleIcon = role.icon;
                        const isExpanded = expandedMatch === idx;
                        const isPast = checkIsPast(match.tarih, match.saat);

                        return (
                            <div key={`${match.mac_adi}-${match.tarih}-${idx}`}
                                className={`bg-white dark:bg-zinc-900 border rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-md ${isExpanded ? "border-red-200 dark:border-red-800 shadow-md" : "border-zinc-200 dark:border-zinc-800"}`}>
                                <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                                    onClick={() => setExpandedMatch(isExpanded ? null : idx)}>
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shrink-0 shadow-sm`}>
                                        <RoleIcon className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-zinc-900 dark:text-white truncate">{match.mac_adi}</p>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                            {match.tarih && <span className="flex items-center gap-1 text-xs text-zinc-400"><Calendar className="w-3 h-3" /> {formatDisplayDate(match.tarih)}</span>}
                                            {match.saat && <span className="flex items-center gap-1 text-xs text-zinc-400"><Clock className="w-3 h-3" /> {match.saat}</span>}
                                            {match.salon && (
                                                <a
                                                    href={getGoogleMapsUrl(match.salon)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                                                    title="Google Maps'te Yol Tarifi Al"
                                                >
                                                    <MapPin className="w-3 h-3" /> {match.salon}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                                        {match.hafta && <span className="px-2 py-0.5 bg-violet-500/10 rounded-lg text-[10px] font-bold text-violet-600">{match.hafta}. Hafta</span>}
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isPast ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
                                            {isPast ? "Oynanmış" : "Gelecek"}
                                        </span>
                                        <span className={`px-2.5 py-1 ${role.bg} rounded-lg text-[11px] font-bold ${role.text}`}>{role.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />}
                                </div>

                                {/* Mobile badges */}
                                {!isExpanded && (
                                    <div className="flex sm:hidden items-center gap-2 px-4 pb-3 -mt-1 flex-wrap">
                                        {match.hafta && <span className="px-2 py-0.5 bg-violet-500/10 rounded-lg text-[10px] font-bold text-violet-600">{match.hafta}. Hafta</span>}
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isPast ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
                                            {isPast ? "Oynanmış" : "Gelecek"}
                                        </span>
                                        <span className={`px-2.5 py-1 ${role.bg} rounded-lg text-[11px] font-bold ${role.text}`}>{role.label}</span>
                                    </div>
                                )}

                                {/* Expanded content */}
                                {isExpanded && (
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-800/20">
                                        <div className="flex sm:hidden flex-wrap gap-2 mb-3">
                                            {match.hafta && <span className="px-2 py-0.5 bg-violet-500/10 rounded-lg text-[10px] font-bold text-violet-600">{match.hafta}. Hafta</span>}
                                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${isPast ? "bg-emerald-500/10 text-emerald-600" : "bg-blue-500/10 text-blue-600"}`}>
                                                {isPast ? "Oynanmış" : "Gelecek"}
                                            </span>
                                            <span className={`px-2.5 py-1 ${role.bg} rounded-lg text-[11px] font-bold ${role.text}`}>{role.label}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {match.hakemler.length > 0 && <PersonnelCard icon={<Trophy className="w-4 h-4 text-red-500" />} title="Hakemler" people={match.hakemler} firstName={firstName} lastName={lastName} highlight="text-red-600" phones={personnelPhones} />}
                                            {match.masa_gorevlileri.length > 0 && <PersonnelCard icon={<Briefcase className="w-4 h-4 text-blue-500" />} title="Masa Görevlileri" people={match.masa_gorevlileri} firstName={firstName} lastName={lastName} highlight="text-blue-600" phones={personnelPhones} />}
                                            {match.saglikcilar.length > 0 && <PersonnelCard icon={<HeartPulse className="w-4 h-4 text-emerald-500" />} title="Sağlıkçılar" people={match.saglikcilar} firstName={firstName} lastName={lastName} highlight="text-emerald-600" phones={personnelPhones} />}
                                            {match.istatistikciler.length > 0 && <PersonnelCard icon={<BarChart3 className="w-4 h-4 text-violet-500" />} title="İstatistikçiler" people={match.istatistikciler} firstName={firstName} lastName={lastName} highlight="text-violet-600" phones={personnelPhones} />}
                                            {match.gozlemciler.length > 0 && <PersonnelCard icon={<Eye className="w-4 h-4 text-amber-500" />} title="Gözlemciler" people={match.gozlemciler} firstName={firstName} lastName={lastName} highlight="text-amber-600" phones={personnelPhones} />}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] text-zinc-400">{match.ligTuru}</span>
                                            <span className="text-[10px] text-zinc-400 italic">📄 {match.kaynak_dosya}</span>
                                            {match.salon && (
                                                <a
                                                    href={getGoogleMapsUrl(match.salon)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                                >
                                                    <Navigation className="w-3 h-3" />
                                                    Yol Tarifi Al
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {visibleCount < filteredMatches.length && (
                        <button onClick={() => setVisibleCount(prev => prev + 30)}
                            className="w-full py-3 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl text-sm font-bold text-zinc-600 dark:text-zinc-300 transition-colors">
                            Daha Fazla Göster ({filteredMatches.length - visibleCount} maç kaldı)
                        </button>
                    )}
                </div>
            )}
            {/* Download Modal */}
            {downloadModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white">Excel İndir</h3>
                        </div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 font-medium">
                            İndirmek istediğiniz maçların tarih aralığını seçin. Bütün maçları indirmek isterseniz çok geniş bir aralık verebilirsiniz.
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">Başlangıç Tarihi</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase mb-1.5">Bitiş Tarihi</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 mt-4">
                            <button
                                onClick={() => setDownloadModalOpen(false)}
                                disabled={downloading}
                                className="w-full sm:w-auto px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={() => handleDownloadExcel(true)}
                                disabled={downloading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                                Tümünü İndir
                            </button>
                            <button
                                onClick={() => handleDownloadExcel(false)}
                                disabled={downloading}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            >
                                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                {downloading ? "Hazırlanıyor..." : "İndir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================================
// Sub-components
// ============================================================

function StatCard({ icon, value, label, gradient, onClick }: { icon: React.ReactNode; value: number; label: string; gradient: string; onClick?: () => void }) {
    return (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 text-white shadow-lg${onClick ? " sm:cursor-default cursor-pointer active:scale-95 sm:active:scale-100 transition-transform" : ""}`}
            onClick={onClick}
        >
            <div className="opacity-80 mb-2">{icon}</div>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-white/80 text-xs font-medium">{label}</p>
        </div>
    );
}

function FilterTab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
    return (
        <button onClick={onClick}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${active
                ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md scale-[1.02]"
                : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-red-300"}`}>
            {label}
        </button>
    );
}

function PersonnelCard({ icon, title, people, firstName, lastName, highlight, phones }: {
    icon: React.ReactNode; title: string; people: string[]; firstName: string; lastName: string; highlight: string; phones: Record<string, string>;
}) {
    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{title}</span>
            </div>
            <div className="space-y-2">
                {people.map((p, i) => {
                    const isMe = nameMatchesClient(p, firstName, lastName);
                    const n = normalizeTR(p);
                    // Handle typos logic from before is embedded in normalizeTR
                    const phone = phones[n];

                    return (
                        <div key={i} className={`text-sm flex flex-col ${isMe ? `font-black ${highlight}` : "text-zinc-600 dark:text-zinc-300"}`}>
                            <div className="flex items-center">
                                {isMe && <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mr-2" />}
                                {p}
                            </div>
                            {phone && !isMe && (
                                <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-[11px] font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 mt-0.5 ml-3">
                                    📞 {phone}
                                </a>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
