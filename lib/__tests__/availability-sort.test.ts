import { describe, it, expect } from "vitest";
import { sortForms, SHORT_CLASSIFICATION_LABEL } from "../availability-sort";

// Yardımcı: hakem formu oluştur
function makeRefereeForm(classification: string, lastName: string, firstName: string, regions: string[] = []) {
    return {
        referee: {
            classification,
            lastName,
            firstName,
            regions: regions.map(name => ({ name })),
        },
        official: null,
        days: [],
    };
}

// Yardımcı: genel görevli formu oluştur
function makeOfficialForm(lastName: string, firstName: string) {
    return {
        referee: null,
        official: {
            lastName,
            firstName,
            regions: [],
        },
        days: [],
    };
}

describe("SHORT_CLASSIFICATION_LABEL", () => {
    it("A Klasmanı → A", () => expect(SHORT_CLASSIFICATION_LABEL["A Klasmanı"]).toBe("A"));
    it("B Klasmanı → B", () => expect(SHORT_CLASSIFICATION_LABEL["B Klasmanı"]).toBe("B"));
    it("C Klasmanı → C", () => expect(SHORT_CLASSIFICATION_LABEL["C Klasmanı"]).toBe("C"));
    it("İl Hakemi → İL", () => expect(SHORT_CLASSIFICATION_LABEL["İl Hakemi"]).toBe("İL"));
    it("Aday Hakem → ADAY", () => expect(SHORT_CLASSIFICATION_LABEL["Aday Hakem"]).toBe("ADAY"));
    it("Bölge Hakemi → BÖLGE", () => expect(SHORT_CLASSIFICATION_LABEL["Bölge Hakemi"]).toBe("BÖLGE"));
    it("Ulusal Hakem → ULUSAL", () => expect(SHORT_CLASSIFICATION_LABEL["Ulusal Hakem"]).toBe("ULUSAL"));
    it("FIBA Hakemi → FIBA", () => expect(SHORT_CLASSIFICATION_LABEL["FIBA Hakemi"]).toBe("FIBA"));
    it("bilinmeyen key → undefined (fallback ?? çalışır)", () => {
        expect(SHORT_CLASSIFICATION_LABEL["Bilinmeyen Klasman"]).toBeUndefined();
    });
});

describe("sortForms — REFEREE grubu", () => {
    it("A klasmanlı hakem B klasmanlıdan önce gelir", () => {
        const forms = [
            makeRefereeForm("B", "Yılmaz", "Ali"),
            makeRefereeForm("A", "Yılmaz", "Ali"),
        ];
        const sorted = sortForms(forms, "REFEREE");
        expect(sorted[0].referee.classification).toBe("A");
        expect(sorted[1].referee.classification).toBe("B");
    });

    it("Klasman sırası: A < B < C < IL_HAKEM < ADAY_HAKEM", () => {
        const forms = [
            makeRefereeForm("ADAY_HAKEM", "Arslan", "Mehmet"),
            makeRefereeForm("C", "Arslan", "Mehmet"),
            makeRefereeForm("A", "Arslan", "Mehmet"),
            makeRefereeForm("IL_HAKEM", "Arslan", "Mehmet"),
            makeRefereeForm("B", "Arslan", "Mehmet"),
        ];
        const sorted = sortForms(forms, "REFEREE");
        expect(sorted[0].referee.classification).toBe("A");
        expect(sorted[1].referee.classification).toBe("B");
        expect(sorted[2].referee.classification).toBe("C");
        expect(sorted[3].referee.classification).toBe("IL_HAKEM");   // İl Hakemi order=3
        expect(sorted[4].referee.classification).toBe("ADAY_HAKEM"); // Aday Hakem order=4
    });

    it("Aynı klasman içinde soyad A-Z sıralanır", () => {
        const forms = [
            makeRefereeForm("A", "Yılmaz", "Ali"),
            makeRefereeForm("A", "Arslan", "Ali"),
            makeRefereeForm("A", "Çelik", "Ali"),
        ];
        const sorted = sortForms(forms, "REFEREE");
        expect(sorted[0].referee.lastName).toBe("Arslan");
        expect(sorted[1].referee.lastName).toBe("Çelik");
        expect(sorted[2].referee.lastName).toBe("Yılmaz");
    });

    it("Aynı soyad ise ad A-Z sıralanır", () => {
        const forms = [
            makeRefereeForm("A", "Yılmaz", "Zeynep"),
            makeRefereeForm("A", "Yılmaz", "Ali"),
            makeRefereeForm("A", "Yılmaz", "Mehmet"),
        ];
        const sorted = sortForms(forms, "REFEREE");
        expect(sorted[0].referee.firstName).toBe("Ali");
        expect(sorted[1].referee.firstName).toBe("Mehmet");
        expect(sorted[2].referee.firstName).toBe("Zeynep");
    });

    it("Bölge farklılığı sıralamayı ETKİLEMEZ — aynı klasmanda isim A-Z öncelikli", () => {
        // Avrupa bölgesindeki hakem soyadı Z ile başlıyor
        // Anadolu bölgesindeki hakem soyadı A ile başlıyor
        // Bölge kaldırıldığından isim A-Z öncelikli olmalı
        const forms = [
            makeRefereeForm("A", "Zorlu", "Ali", ["Avrupa"]),
            makeRefereeForm("A", "Arslan", "Ali", ["Anadolu"]),
        ];
        const sorted = sortForms(forms, "REFEREE");
        expect(sorted[0].referee.lastName).toBe("Arslan"); // A-Z, bölgeden bağımsız
        expect(sorted[1].referee.lastName).toBe("Zorlu");
    });

    it("Bilinmeyen klasman (order=99) en sona düşer", () => {
        const forms = [
            makeRefereeForm("BILINMEYEN_KLASMAN", "Aydın", "Can"),
            makeRefereeForm("A", "Yılmaz", "Ali"),
        ];
        const sorted = sortForms(forms, "REFEREE");
        expect(sorted[0].referee.classification).toBe("A");
        expect(sorted[1].referee.classification).toBe("BILINMEYEN_KLASMAN");
    });

    it("Orijinal diziyi mutate etmez (yeni dizi döner)", () => {
        const forms = [
            makeRefereeForm("B", "Yılmaz", "Ali"),
            makeRefereeForm("A", "Arslan", "Mehmet"),
        ];
        const original = [...forms];
        sortForms(forms, "REFEREE");
        expect(forms[0].referee.classification).toBe(original[0].referee.classification);
    });
});

describe("sortForms — GENERAL grubu", () => {
    it("Genel görevlilerde klasman etkisiz — isim A-Z sıralanır", () => {
        const forms = [
            makeOfficialForm("Yılmaz", "Ali"),
            makeOfficialForm("Arslan", "Mehmet"),
            makeOfficialForm("Çelik", "Veli"),
        ];
        const sorted = sortForms(forms, "GENERAL");
        expect(sorted[0].official.lastName).toBe("Arslan");
        expect(sorted[1].official.lastName).toBe("Çelik");
        expect(sorted[2].official.lastName).toBe("Yılmaz");
    });

    it("Boş dizi → boş dizi döner", () => {
        expect(sortForms([], "GENERAL")).toEqual([]);
    });
});
