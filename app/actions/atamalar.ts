"use server";

import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getGlobalMatchesStore } from "@/lib/matches-store";

function requireSuperAdmin(role: string) {
    if (role !== "SUPER_ADMIN") throw new Error("Yetkisiz");
}

export async function getTeamNames(): Promise<{ success: boolean; teams: string[]; error?: string }> {
    try {
        const session = await verifySession();
        requireSuperAdmin(session.role);

        const store = await getGlobalMatchesStore();
        if (!store?.allMatches) return { success: true, teams: [] };

        const relevantMatches = store.allMatches.filter((m: any) =>
            m.ligTuru === "Yerel Lig" || m.ligTuru === "ÖZEL LİG VE ÜNİVERSİTE"
        );

        const teamNames = new Set<string>();
        for (const match of relevantMatches) {
            const parts = (match.mac_adi || "").split(/\s*[-–—]\s*/);
            for (const part of parts) {
                const clean = part.trim();
                // Skip pure numbers, very short strings, date-like strings
                if (clean.length > 2 && !/^\d+$/.test(clean) && !/\d{1,2}\.\d{1,2}\.\d{4}/.test(clean)) {
                    teamNames.add(clean);
                }
            }
        }

        return { success: true, teams: Array.from(teamNames).sort((a, b) => a.localeCompare(b, "tr")) };
    } catch (e: any) {
        return { success: false, teams: [], error: e?.message || "Takım adları alınamadı" };
    }
}

export async function getAssignments() {
    try {
        const session = await verifySession();
        requireSuperAdmin(session.role);

        const assignments = await (db as any).gameAssignment.findMany({
            orderBy: { tarih: "asc" },
        });

        return { success: true, assignments };
    } catch (e: any) {
        return { success: false, assignments: [], error: e?.message };
    }
}

export interface AssignmentFormData {
    tarih: string;   // "YYYY-MM-DD"
    saat?: string;
    salon?: string;
    aTeam: string;
    bTeam: string;
    kategori?: string;
    grup?: string;
    hakem1?: string;
    hakem2?: string;
    sayiGorevlisi?: string;
    saatGorevlisi?: string;
    sutSaatiGorevlisi?: string;
    gozlemci?: string;
    sahaKomiseri?: string;
    saglikci?: string;
    istatistikci1?: string;
    istatistikci2?: string;
}

function buildDbData(data: AssignmentFormData) {
    return {
        tarih: data.tarih ? new Date(data.tarih) : new Date(),
        saat: data.saat || null,
        salon: data.salon || null,
        aTeam: data.aTeam || "",
        bTeam: data.bTeam || "",
        kategori: data.kategori || null,
        grup: data.grup || null,
        hakem1: data.hakem1 || null,
        hakem2: data.hakem2 || null,
        sayiGorevlisi: data.sayiGorevlisi || null,
        saatGorevlisi: data.saatGorevlisi || null,
        sutSaatiGorevlisi: data.sutSaatiGorevlisi || null,
        gozlemci: data.gozlemci || null,
        sahaKomiseri: data.sahaKomiseri || null,
        saglikci: data.saglikci || null,
        istatistikci1: data.istatistikci1 || null,
        istatistikci2: data.istatistikci2 || null,
    };
}

export async function createAssignment(data: AssignmentFormData) {
    try {
        const session = await verifySession();
        requireSuperAdmin(session.role);

        await (db as any).gameAssignment.create({ data: buildDbData(data) });
        revalidatePath("/admin/atamalar");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e?.message || "Atama oluşturulamadı" };
    }
}

export async function updateAssignment(id: number, data: AssignmentFormData) {
    try {
        const session = await verifySession();
        requireSuperAdmin(session.role);

        await (db as any).gameAssignment.update({
            where: { id },
            data: buildDbData(data),
        });
        revalidatePath("/admin/atamalar");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e?.message || "Atama güncellenemedi" };
    }
}

export async function deleteAssignment(id: number) {
    try {
        const session = await verifySession();
        requireSuperAdmin(session.role);

        await (db as any).gameAssignment.delete({ where: { id } });
        revalidatePath("/admin/atamalar");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e?.message || "Atama silinemedi" };
    }
}
