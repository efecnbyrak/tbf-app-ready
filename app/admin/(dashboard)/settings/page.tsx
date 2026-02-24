import { db } from "@/lib/db";
import { SettingsForm } from "./SettingsForm";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
    // Fetch settings
    const modeSetting = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_MODE" } });
    const seasonSetting = await db.systemSetting.findUnique({ where: { key: "CURRENT_SEASON" } });
    const targetDateSetting = await db.systemSetting.findUnique({ where: { key: "AVAILABILITY_TARGET_DATE" } });
    const weekNumberSetting = await db.systemSetting.findUnique({ where: { key: "CURRENT_WEEK_NUMBER" } });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Sistem Ayarları</h1>
            <SettingsForm
                initialMode={modeSetting?.value || "AUTO"}
                initialSeason={seasonSetting?.value || "2025-2026"}
                initialTargetDate={targetDateSetting?.value || ""}
                initialWeekNumber={weekNumberSetting?.value || "1"}
            />
        </div>
    );
}
