"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface MatchPaymentRate {
    basHakem: number;
    yardimciHakem: number;
}

export interface SpecialLeagueRate {
    id: string;
    name: string;
    basHakem: number;
    yardimciHakem: number;
}

export interface PaymentConfig {
    standardMatches: {
        okul: MatchPaymentRate;
        il: MatchPaymentRate;
        ilce: MatchPaymentRate;
        bolge: MatchPaymentRate;
    };
    specialLeagues: SpecialLeagueRate[];
}

const DEFAULT_CONFIG: PaymentConfig = {
    standardMatches: {
        okul: { basHakem: 0, yardimciHakem: 0 },
        il: { basHakem: 0, yardimciHakem: 0 },
        ilce: { basHakem: 0, yardimciHakem: 0 },
        bolge: { basHakem: 0, yardimciHakem: 0 },
    },
    specialLeagues: [],
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
    try {
        const setting = await db.systemSetting.findUnique({ where: { key: "PAYMENT_CONFIG" } });
        if (!setting?.value) return DEFAULT_CONFIG;
        const parsed = JSON.parse(setting.value) as PaymentConfig;
        return {
            standardMatches: {
                okul: { basHakem: 0, yardimciHakem: 0, ...parsed.standardMatches?.okul },
                il: { basHakem: 0, yardimciHakem: 0, ...parsed.standardMatches?.il },
                ilce: { basHakem: 0, yardimciHakem: 0, ...parsed.standardMatches?.ilce },
                bolge: { basHakem: 0, yardimciHakem: 0, ...parsed.standardMatches?.bolge },
            },
            specialLeagues: parsed.specialLeagues || [],
        };
    } catch {
        return DEFAULT_CONFIG;
    }
}

export async function savePaymentConfig(config: PaymentConfig) {
    const session = await verifySession();
    if (session?.role !== "SUPER_ADMIN") return { error: "Yetkisiz işlem." };

    try {
        await db.systemSetting.upsert({
            where: { key: "PAYMENT_CONFIG" },
            create: { key: "PAYMENT_CONFIG", value: JSON.stringify(config) },
            update: { value: JSON.stringify(config) },
        });
        revalidatePath("/admin/payments");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Kaydetme başarısız." };
    }
}

/** Drive'daki ÖZEL LİG dosyalarından benzersiz kategorileri çeker */
export async function getSpecialLeagueCategories(): Promise<string[]> {
    try {
        const setting = await db.systemSetting.findUnique({ where: { key: "GLOBAL_MATCH_REGISTRY" } });
        if (!setting?.value) return [];
        const registry = JSON.parse(setting.value);
        const matches: any[] = registry.allMatches || [];
        const cats = new Set<string>();
        for (const m of matches) {
            if (
                m.ligTuru === "ÖZEL LİG VE ÜNİVERSİTE" &&
                m.kategori &&
                m.kategori.trim().length > 0
            ) {
                cats.add(m.kategori.trim());
            }
        }
        return Array.from(cats).sort();
    } catch {
        return [];
    }
}
