import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";
import { getAvailabilityWindow } from "@/lib/availability-utils";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    // Fetch settings
    const [modeS, seasonS, ibanRequiredS] = await Promise.all([
        db.systemSetting.findUnique({ where: { key: "AVAILABILITY_MODE" } }),
        db.systemSetting.findUnique({ where: { key: "CURRENT_SEASON" } }),
        db.systemSetting.findUnique({ where: { key: "IBAN_COLLECTION_ENABLED" } })
    ]);

    const window = await getAvailabilityWindow();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Sistem Ayarları</h1>
            <SettingsForm
                initialMode={modeS?.value || "AUTO"}
                initialSeason={seasonS?.value || "2025-2026"}
                initialTargetDate={window.startDate.toISOString()}
                initialWeekNumber={window.weekNumber.toString()}
                initialIbanRequired={ibanRequiredS?.value === "true"}
            />
        </div>
    );
}
