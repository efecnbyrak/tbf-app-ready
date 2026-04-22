"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export interface PaymentRate {
    basHakem: number;
    yardimciHakem: number;
    gozlemci: number;
    masaGorevlisi: number;
    istatistikci: number;
    saglikci: number;
    sahaKomiseri: number;
}

export interface CategoryRate {
    id: string;
    name: string;
    rates: PaymentRate;
}

export interface PaymentConfig {
    okulMaclari: PaymentRate;
    bolgeMaclari: PaymentRate;
    kategoriler: CategoryRate[];
}

export const EMPTY_RATE: PaymentRate = {
    basHakem: 0,
    yardimciHakem: 0,
    gozlemci: 0,
    masaGorevlisi: 0,
    istatistikci: 0,
    saglikci: 0,
    sahaKomiseri: 0,
};

const DEFAULT_CONFIG: PaymentConfig = {
    okulMaclari: { ...EMPTY_RATE },
    bolgeMaclari: { ...EMPTY_RATE },
    kategoriler: [],
};

function mergeRate(saved: Partial<PaymentRate> | undefined): PaymentRate {
    return { ...EMPTY_RATE, ...saved };
}

export async function getPaymentConfig(): Promise<PaymentConfig> {
    try {
        const setting = await db.systemSetting.findUnique({ where: { key: "PAYMENT_CONFIG" } });
        if (!setting?.value) return DEFAULT_CONFIG;
        const parsed = JSON.parse(setting.value) as PaymentConfig;
        return {
            okulMaclari: mergeRate(parsed.okulMaclari),
            bolgeMaclari: mergeRate(parsed.bolgeMaclari),
            kategoriler: (parsed.kategoriler || []).map((k) => ({
                id: k.id,
                name: k.name,
                rates: mergeRate(k.rates),
            })),
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

/** Sistemdeki tüm benzersiz kategorileri çeker */
export async function getAllMatchCategories(): Promise<string[]> {
    try {
        const setting = await db.systemSetting.findUnique({ where: { key: "GLOBAL_MATCH_REGISTRY" } });
        if (!setting?.value) return [];
        const registry = JSON.parse(setting.value);
        const matches: any[] = registry.allMatches || [];
        const cats = new Set<string>();
        for (const m of matches) {
            if (m.kategori && m.kategori.trim().length > 0) {
                cats.add(m.kategori.trim());
            }
        }
        return Array.from(cats).sort((a, b) => a.localeCompare(b, "tr"));
    } catch {
        return [];
    }
}
