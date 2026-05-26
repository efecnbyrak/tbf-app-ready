import { describe, it, expect } from "vitest";
import { formatClassification, formatOfficialType } from "../format-utils";

describe("formatClassification", () => {
    it("A → A Klasmanı", () => {
        expect(formatClassification("A")).toBe("A Klasmanı");
    });
    it("B → B Klasmanı", () => {
        expect(formatClassification("B")).toBe("B Klasmanı");
    });
    it("C → C Klasmanı", () => {
        expect(formatClassification("C")).toBe("C Klasmanı");
    });
    it("ADAY_HAKEM → Aday Hakem", () => {
        expect(formatClassification("ADAY_HAKEM")).toBe("Aday Hakem");
    });
    it("IL_HAKEM → İl Hakemi", () => {
        expect(formatClassification("IL_HAKEM")).toBe("İl Hakemi");
    });
    it("IL_HAKEMI → İl Hakemi (legacy)", () => {
        expect(formatClassification("IL_HAKEMI")).toBe("İl Hakemi");
    });
    it("ULUSAL_HAKEM → Ulusal Hakem", () => {
        expect(formatClassification("ULUSAL_HAKEM")).toBe("Ulusal Hakem");
    });
    it("FIBA_HAKEM → FIBA Hakemi", () => {
        expect(formatClassification("FIBA_HAKEM")).toBe("FIBA Hakemi");
    });
    it("bilinmeyen key → kendisi döner", () => {
        expect(formatClassification("UNKNOWN_KEY")).toBe("UNKNOWN_KEY");
    });
});

describe("formatOfficialType", () => {
    it("TABLE → Masa Görevlisi", () => {
        expect(formatOfficialType("TABLE")).toBe("Masa Görevlisi");
    });
    it("OBSERVER → Gözlemci", () => {
        expect(formatOfficialType("OBSERVER")).toBe("Gözlemci");
    });
    it("STATISTICIAN → İstatistik Görevlisi", () => {
        expect(formatOfficialType("STATISTICIAN")).toBe("İstatistik Görevlisi");
    });
    it("HEALTH → Sağlık Görevlisi", () => {
        expect(formatOfficialType("HEALTH")).toBe("Sağlık Görevlisi");
    });
    it("FIELD_COMMISSIONER → Saha Komiseri", () => {
        expect(formatOfficialType("FIELD_COMMISSIONER")).toBe("Saha Komiseri");
    });
    it("bilinmeyen key → kendisi döner", () => {
        expect(formatOfficialType("BILINMEYEN")).toBe("BILINMEYEN");
    });
});
