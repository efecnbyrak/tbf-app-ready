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

    // 2. Fetch DATA (ALL forms for the window)
    const allForms = await db.availabilityForm.findMany({
        where: { weekStartDate: startDate },
        include: {
            referee: { include: { regions: true } },
            official: { include: { regions: true } },
            days: true
        }
    });

    // Sort to emulate the orderBy logic
    allForms.sort((a, b) => {
        const lastNameA = a.referee?.lastName || a.official?.lastName || "";
        const lastNameB = b.referee?.lastName || b.official?.lastName || "";
        return lastNameA.localeCompare(lastNameB, 'tr-TR');
    });

    // In-Memory Categorization
    const categoryMap = new Map<string, typeof allForms>();
    const allEligibleForms = allForms;

    allForms.forEach(form => {
        const type = form.official?.officialType || "REFEREE";
        if (!categoryMap.has(type)) categoryMap.set(type, []);
        categoryMap.get(type)!.push(form);
    });

    // 3. Generate Excel
    try {
        const workbook = new ExcelJS.Workbook();

        // Helper to add a sheet with data
        const addDataSheet = (sheetName: string, data: typeof allForms) => {
            const worksheet = workbook.addWorksheet(sheetName);

            // Prepare Headers based on Dates
            const dateHeaders = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const weekday = d.toLocaleDateString('tr-TR', { weekday: 'long' });
                const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                dateHeaders.push(`${weekday} ${dateStr}`);
            }

            worksheet.columns = [
                { header: 'AD SOYAD', key: 'name', width: 25 },
                { header: 'GÖREV', key: 'officialType', width: 20 },
                { header: 'KLASMAN', key: 'class', width: 15 },
                { header: 'TELEFON', key: 'phone', width: 15 },
                { header: 'BÖLGELER', key: 'regions', width: 20 },
                ...dateHeaders.map((dh, i) => ({ header: dh.toUpperCase(), key: `day_${i}`, width: 24 }))
            ];

            // Style Header
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDC143C' } // Crimson Red (TBF Kırmızı)
            };
            headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

            // Add Rows
            data.forEach(form => {
                const isOff = !!form.official;
                const ref = form.referee || form.official;
                if (!ref) return;

                const regions = ref.regions.map(r => r.name).join(", ");
                const oType = isOff ? (form.official?.officialType || "TABLE") : "REFEREE";
                const oTypeLabel = ({
                    "REFEREE": "Hakem",
                    "OBSERVER": "Gözlemci",
                    "TABLE": "Masa Görevlisi",
                    "STATISTICIAN": "İstatistik Görevlisi",
                    "HEALTH": "Sağlık Görevlisi",
                    "TABLE_STATISTICIAN": "Masa & İstatistikçi",
                    "TABLE_HEALTH": "Masa & Sağlıkçı",
                    "FIELD_COMMISSIONER": "Saha Komiseri"
                } as Record<string, string>)[oType] || oType;

                const rowData: any = {
                    name: `${ref.firstName} ${ref.lastName}`,
                    officialType: oTypeLabel,
                    class: !isOff ? formatClassification((ref as any).classification) : "GÖREVLİ",
                    phone: ref.phone,
                    regions: regions
                };

                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    const dayId = d.toISOString().split('T')[0];
                    const dayRecord = form.days.find(fd => fd.date.toISOString().split('T')[0] === dayId);

                    if (dayRecord) {
                        let slots = dayRecord.slots;
                        if (slots) {
                            slots = slots.replace(/\s+(Sonrası|Öncesi|İtibaren|Arası)/gi, '');
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
                    if (rowNumber > 1) {
                        if (colNumber >= 6) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        } else {
                            cell.alignment = { vertical: 'middle', wrapText: true };
                        }
                    }
                });
                if (rowNumber > 1) row.height = 20;
            });
        };

        // 1. "HEPSİ" Sheet (Sorted: OBSERVER first, then others)
        const sortedAllForms = [...allEligibleForms].sort((a, b) => {
            const typeA = a.official?.officialType || "REFEREE";
            const typeB = b.official?.officialType || "REFEREE";

            if (typeA === "OBSERVER" && typeB !== "OBSERVER") return -1;
            if (typeA !== "OBSERVER" && typeB === "OBSERVER") return 1;

            // Sub-sort by name
            const lastNameA = a.referee?.lastName || a.official?.lastName || "";
            const lastNameB = b.referee?.lastName || b.official?.lastName || "";
            return lastNameA.localeCompare(lastNameB, 'tr-TR');
        });

        if (sortedAllForms.length > 0) {
            addDataSheet("HEPSİ", sortedAllForms);
        }

        // 2. Specific Category Sheets
        const types = [
            { id: "REFEREE", label: "Hakemler" },
            { id: "OBSERVER", label: "Gözlemciler" },
            { id: "TABLE", label: "Masa Görevlileri" },
            { id: "STATISTICIAN", label: "İstatistikçiler" },
            { id: "HEALTH", label: "Sağlıkçılar" },
            { id: "TABLE_STATISTICIAN", label: "Masa & İstatistik" },
            { id: "TABLE_HEALTH", label: "Masa & Sağlık" },
            { id: "FIELD_COMMISSIONER", label: "Saha Komiserleri" }
        ];

        types.forEach(type => {
            const forms = categoryMap.get(type.id);
            if (forms && forms.length > 0) {
                addDataSheet(type.label, forms);
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();

        const filename = `TBF_Uygunluk_Listesi_${startDate.toISOString().split('T')[0]}.xlsx`;

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

