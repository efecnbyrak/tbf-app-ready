import { NextResponse } from "next/server";
import { findAllSpreadsheets } from "@/lib/google-drive";
import { getCachedData } from "@/lib/cache";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const folderIds = (process.env.GOOGLE_DRIVE_FOLDER_ID || "")
            .split(",").map((s: string) => s.trim()).filter(Boolean);

        if (folderIds.length === 0) {
            return NextResponse.json({ error: "Drive klasör ID ayarlanmamış." });
        }

        const discovery = await getCachedData(
            `drive-discovery-${folderIds.join('-')}`,
            () => findAllSpreadsheets(folderIds),
            10 * 60 * 1000 // 10 mins cache
        );

        return NextResponse.json({
            success: true,
            files: discovery.files.map(s => ({ id: s.id, name: s.name })),
            errors: discovery.errors
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
