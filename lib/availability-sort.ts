import { formatClassification } from "./format-utils";

export const CLASSIFICATION_ORDER: Record<string, number> = {
    "A Klasmanı": 0,
    "B Klasmanı": 1,
    "C Klasmanı": 2,
    "İl Hakemi": 3,
    "Aday Hakem": 4,
    "Bölge Hakemi": 5,
    "Ulusal Hakem": 6,
    "FIBA Hakemi": 7,
};

export const SHORT_CLASSIFICATION_LABEL: Record<string, string> = {
    "A Klasmanı":   "A",
    "B Klasmanı":   "B",
    "C Klasmanı":   "C",
    "İl Hakemi":    "İL",
    "Aday Hakem":   "ADAY",
    "Bölge Hakemi": "BÖLGE",
    "Ulusal Hakem": "ULUSAL",
    "FIBA Hakemi":  "FIBA",
};

export function sortForms(forms: any[], group: "REFEREE" | "GENERAL"): any[] {
    return [...forms].sort((a, b) => {
        const refA = a.referee || a.official;
        const refB = b.referee || b.official;

        if (group === "REFEREE") {
            const classA = CLASSIFICATION_ORDER[formatClassification((refA as any)?.classification)] ?? 99;
            const classB = CLASSIFICATION_ORDER[formatClassification((refB as any)?.classification)] ?? 99;
            if (classA !== classB) return classA - classB;
        }

        const lastA = (refA?.lastName || "").toLocaleUpperCase("tr-TR");
        const lastB = (refB?.lastName || "").toLocaleUpperCase("tr-TR");
        const lastCmp = lastA.localeCompare(lastB, "tr-TR");
        if (lastCmp !== 0) return lastCmp;

        const firstA = (refA?.firstName || "").toLocaleUpperCase("tr-TR");
        const firstB = (refB?.firstName || "").toLocaleUpperCase("tr-TR");
        return firstA.localeCompare(firstB, "tr-TR");
    });
}
