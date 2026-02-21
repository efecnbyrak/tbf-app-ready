import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { formatClassification } from "@/lib/format-utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const session = await verifySession();
    if (session.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const group = searchParams.get("group") || "REFEREE";
    const type = searchParams.get("type");

    const { startDate } = await getAvailabilityWindow();

    // 1. Cleanup Policy
    const cleanupDate = new Date(startDate);
    cleanupDate.setDate(startDate.getDate() - 15);

    await db.availabilityForm.deleteMany({
        where: {
            weekStartDate: {
                lt: cleanupDate
            }
        }
    });

    // Filter Logic
    // Fetch Referee Types manually via Raw Query to bypass stale Prisma Client
    const refereeTypesRaw = await db.$queryRaw<Array<{ id: number, officialType: string }>>`
        SELECT id, "officialType" FROM referees
    `;
    const refereeTypeMap = new Map(refereeTypesRaw.map((r: any) => [r.id, r.officialType || "REFEREE"]));

    // 2. Fetch DATA (ALL forms for the window)
    const allForms = await db.availabilityForm.findMany({
        where: {
            weekStartDate: startDate,
        },
        include: {
            referee: {
                include: { regions: true }
            },
            days: true
        },
        orderBy: {
            referee: {
                lastName: 'asc'
            }
        }
    });

    // In-Memory Filtering
    const forms = allForms.filter(form => {
        const officialType = refereeTypeMap.get(form.refereeId) || "REFEREE";

        if (group === "REFEREE") {
            return officialType === "REFEREE";
        } else {
            // GENERAL Group
            if (type) {
                return officialType === type;
            } else {
                return officialType !== "REFEREE";
            }
        }
    });

    // 3. Generate Excel
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Uygunluk Bildirimleri");

        // Prepare Headers based on Dates
        // Sat to Fri
        const dateHeaders = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            // Format: "Cumartesi 24/01" instead of "24/01 cmt"
            const weekday = d.toLocaleDateString('tr-TR', { weekday: 'long' });
            const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
            dateHeaders.push(`${weekday} ${dateStr}`);
        }

        worksheet.columns = [
            { header: 'AD SOYAD', key: 'name', width: 25 },
            { header: 'KLASMAN', key: 'class', width: 15 },
            { header: 'TELEFON', key: 'phone', width: 15 },
            { header: 'BÖLGELER', key: 'regions', width: 20 }, // Fits "Avrupa, Asya, BGM"
            // Date columns - optimized for desktop view with multiple time slots
            ...dateHeaders.map((dh, i) => ({ header: dh.toUpperCase(), key: `day_${i}`, width: 24 }))
        ];

        // Style Header
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }; // White text
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDC143C' } // Crimson Red (TBF Kırmızı)
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // Add Rows
        forms.forEach(form => {
            const ref = form.referee;
            const regions = ref.regions.map(r => r.name).join(", ");

            const rowData: any = {
                name: `${ref.firstName} ${ref.lastName}`,
                class: formatClassification(ref.classification),
                phone: ref.phone,
                regions: regions
            };

            // Fill days
            // form.days contains the records.
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dayId = d.toISOString().split('T')[0];

                const dayRecord = form.days.find(fd => fd.date.toISOString().split('T')[0] === dayId);

                if (dayRecord) {
                    // Show slots with commas, cleanup unnecessary words and invalid times
                    let slots = dayRecord.slots;
                    if (slots) {
                        // Remove Turkish words like "Sonrası", "Öncesi", etc.
                        slots = slots.replace(/\s+(Sonrası|Öncesi|İtibaren|Arası)/gi, '');

                        // Remove invalid time slot 18:00 (no longer in form)
                        // Handle cases: "18:00", "18:00, 17:00", "17:00, 18:00, 20:00"
                        slots = slots.split(',')
                            .map(s => s.trim())
                            .filter(s => s !== '18:00')
                            .join(', ');
                    }
                    rowData[`day_${i}`] = slots || "-";
                } else {
                    rowData[`day_${i}`] = "-";
                }
            }

            worksheet.addRow(rowData);
        });

        // Styling adjustments for Data rows
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                if (rowNumber > 1) { // Data rows (not header)
                    // For day columns (5th column onwards), center align
                    if (colNumber >= 5) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                    } else {
                        cell.alignment = { vertical: 'middle', wrapText: true };
                    }
                }
            });

            // Set minimum row height for better readability
            if (rowNumber > 1) {
                row.height = 20; // Slight vertical padding
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();

        let typeLabel = "Hakemler";
        if (group === "GENERAL") {
            typeLabel = type ? `Gorevliler_${type}` : "Gorevliler_Tumu";
        }

        const filename = `TBF_${typeLabel}_${startDate.toISOString().split('T')[0]}.xlsx`;

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error("Excel generation error:", error);
        return NextResponse.json({ error: "Excel dosyası oluşturulurken bir hata oluştu." }, { status: 500 });
    }
}
