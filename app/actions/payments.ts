"use server";

import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { EMPTY_RATE } from "@/lib/payment-types";
import type { PaymentConfig, PaymentRate } from "@/lib/payment-types";

function mergeRate(saved: Partial<PaymentRate> | undefined): PaymentRate {
    return { ...EMPTY_RATE, ...saved };
}

const DEFAULT_CONFIG: PaymentConfig = {
    okulMaclari: { ...EMPTY_RATE },
    bolgeMaclari: { ...EMPTY_RATE },
    kategoriler: [],
};

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

export async function savePaymentConfig(config: PaymentConfig & { ekOdemeler?: any[] }) {
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

// Categories that don't belong in the Özel Lig section (Drive data noise)
const EXCLUDED_OZL_CATEGORIES = new Set([
    "1", "1 Hafta", "Güncel", "Okul il ve İlçe (2025-2026)", "Okul İl ve İlçe (2025-2026)",
    "Okul il ve İlçe", "Okul İl ve İlçe",
]);

function isValidOzelLigCategory(cat: string): boolean {
    const trimmed = cat.trim();
    if (EXCLUDED_OZL_CATEGORIES.has(trimmed)) return false;
    // Filter bare numbers or patterns like "1 Hafta", "2 Hafta"
    if (/^\d+$/.test(trimmed)) return false;
    if (/^\d+\s+Hafta$/i.test(trimmed)) return false;
    // Filter anything starting with "Okul" – those belong in the Okul section
    if (/^okul/i.test(trimmed)) return false;
    return true;
}

export async function getAllMatchCategories(): Promise<string[]> {
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
                m.kategori.trim().length > 0 &&
                isValidOzelLigCategory(m.kategori)
            ) {
                cats.add(m.kategori.trim());
            }
        }
        return Array.from(cats).sort((a, b) => a.localeCompare(b, "tr"));
    } catch {
        return [];
    }
}
