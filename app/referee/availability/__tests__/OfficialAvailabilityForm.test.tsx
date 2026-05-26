import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Server action mock — useActionState'in döneceği state'i kontrol etmek için
const mockFormAction = vi.fn();

vi.mock("@/app/actions/availability", () => ({
    saveAvailability: vi.fn(),
}));

vi.mock("react", async () => {
    const actual = await vi.importActual<typeof React>("react");
    return {
        ...actual,
        useActionState: (_action: any, initialState: any) => [initialState, mockFormAction, false],
    };
});

vi.mock("lucide-react", () => ({
    Lock: () => <span data-testid="icon-lock" />,
    Save: () => <span data-testid="icon-save" />,
    AlertTriangle: () => <span data-testid="icon-alert" />,
    CheckCircle2: () => <span data-testid="icon-check" />,
    CalendarCheck: () => <span data-testid="icon-calendar" />,
}));

// DayRow stub — her gün için name="day_X_slot" hidden input render eder
vi.mock("../DayRow", () => ({
    DayRow: ({ index, initialSlot }: { index: number; initialSlot: string | null }) => (
        <input
            type="hidden"
            name={`day_${index}_slot`}
            defaultValue={initialSlot ?? ""}
            data-testid={`day-slot-${index}`}
        />
    ),
}));

import { OfficialAvailabilityForm } from "../OfficialAvailabilityForm";

const startDate = new Date("2025-06-02");
const endDate = new Date("2025-06-08");
const deadline = new Date("2025-06-03T20:30:00");

const baseReferee = {
    firstName: "Ali",
    lastName: "Yılmaz",
    email: "ali@test.com",
    phone: "05551234567",
    classification: "A",
    officialType: null,
    regions: [{ name: "Avrupa" }],
};

const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
});

function renderForm(overrides: Partial<typeof baseReferee> = {}, existingForm: any = null) {
    return render(
        <OfficialAvailabilityForm
            referee={{ ...baseReferee, ...overrides }}
            days={days}
            existingForm={existingForm}
            isLocked={false}
            deadline={deadline}
            startDate={startDate}
            endDate={endDate}
        />
    );
}

describe("OfficialAvailabilityForm — boş form gönderimi", () => {
    beforeEach(() => {
        mockFormAction.mockClear();
    });

    it("Hiçbir şey seçilmeden Kaydet'e basınca hata mesajı ÇIKMAZ", () => {
        renderForm();
        const btn = screen.getByRole("button", { name: /kaydet/i });
        fireEvent.click(btn);
        expect(screen.queryByTestId("icon-alert")).not.toBeInTheDocument();
    });

    it("Hiçbir şey seçilmeden Kaydet'e basınca formAction ÇAĞRILIR", () => {
        renderForm();
        const btn = screen.getByRole("button", { name: /kaydet/i });
        fireEvent.click(btn);
        expect(mockFormAction).toHaveBeenCalledTimes(1);
    });

    it("Bölge seçilmese de hata mesajı ÇIKMAZ", () => {
        renderForm({ regions: [] });
        const btn = screen.getByRole("button", { name: /kaydet/i });
        fireEvent.click(btn);
        // Hata mesajı render edilmemeli
        expect(screen.queryByText(/lütfen en az bir/i)).not.toBeInTheDocument();
    });
});

describe("OfficialAvailabilityForm — Uygun Değil filtresi", () => {
    it("Uygun Değil slot'ları kaydedilen güne dahil edilmez", () => {
        // existingForm: 0. gün Uygun Değil, 1. gün dolu slot
        const existingForm = {
            days: [
                { date: days[0].toISOString(), slots: "Uygun Değil" },
                { date: days[1].toISOString(), slots: "17:00" },
            ],
        };
        renderForm({}, existingForm);
        // savedDays 1 eleman içermeli: sadece days[1]
        // Özet görünümü: "1 gün uygun" yazmıyorsa (form henüz lock değil), lock durumunu kontrol et
        // Bu senaryo lock olmadan ilk render — savedDays existingForm'dan hesaplanır
        // "1 gün uygun" badge'i görünmemeli çünkü isSubmittedLocked=true ama isLocked=false
        // Özet section görünür: savedDays.length > 0 olduğunda
        expect(screen.getByText("1 gün uygun")).toBeInTheDocument();
    });
});

describe("OfficialAvailabilityForm — kilitli form", () => {
    it("isLocked=true olduğunda Kaydet butonu görünmez", () => {
        render(
            <OfficialAvailabilityForm
                referee={baseReferee}
                days={days}
                existingForm={null}
                isLocked={true}
                deadline={deadline}
                startDate={startDate}
                endDate={endDate}
            />
        );
        expect(screen.queryByRole("button", { name: /kaydet/i })).not.toBeInTheDocument();
    });
});
