"use server";

import { verifySession } from "@/lib/session";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

function requireSuperAdmin(role: string) {
    if (role !== "SUPER_ADMIN") throw new Error("Yetkisiz");
}

export async function getAssignments() {
    try {
        const session = await verifySession();
        requireSuperAdmin(session.role);

        const assignments = await (db as any).gameAssignment.findMany({
            orderBy: [{ tarih: "asc" }, { saat: "asc" }],
        });

        return { success: true, assignments };
    } catch (e: any) {
        return { success: false, assignments: [], error: e?.message };
    }
}

export interface AssignmentFormData {
    tarih: string;
    saat?: string;
    salon?: string;
    ligTuru?: string;
    hafta?: string;
    aTeam?: string;
    bTeam?: string;
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

function validate(data: AssignmentFormData): string | null {
    // hakem1 ≠ hakem2
    if (data.hakem1 && data.hakem2 && data.hakem1.trim() === data.hakem2.trim()) {
        return "1. Hakem ve 2. Hakem aynı kişi olamaz.";
    }
    // aTeam ≠ bTeam
    if (data.aTeam && data.bTeam && data.aTeam.trim() === data.bTeam.trim()) {
        return "A Takımı ve B Takımı aynı olamaz.";
    }
    // Time: if today's date is selected, time must be in the future
    if (data.tarih && data.saat) {
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        if (data.tarih === todayStr) {
            const [h, m] = data.saat.split(":").map(Number);
            const nowMin = today.getHours() * 60 + today.getMinutes();
            const inputMin = h * 60 + m;
            if (inputMin <= nowMin) {
                return "Bugünkü bir maç için geçmiş saat verilemez.";
            }
        }
    }
    return null;
}

function buildDbData(data: AssignmentFormData) {
    return {
        tarih: data.tarih ? new Date(data.tarih) : new Date(),
        saat: data.saat || null,
        salon: data.salon || null,
        ligTuru: data.ligTuru || null,
        hafta: data.hafta ? parseInt(data.hafta) : null,
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

        const err = validate(data);
        if (err) return { success: false, error: err };

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

        const err = validate(data);
        if (err) return { success: false, error: err };

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
