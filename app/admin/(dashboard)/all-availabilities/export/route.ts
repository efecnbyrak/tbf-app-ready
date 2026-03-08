import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { formatClassification, formatOfficialType } from "@/lib/format-utils";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && session.role !== "ADMIN_IHK") {
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
    const formsFilter: any = { weekStartDate: startDate };
    if (group === "REFEREE") {
        formsFilter.officialId = null;
    } else if (group === "GENERAL") {
        formsFilter.refereeId = null;
    }

    const allForms = await db.availabilityForm.findMany({
        where: formsFilter,
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
                { header: 'BÖLGELER', key: 'regions', width: 45 },
                ...dateHeaders.map((dh, i) => ({ header: dh.toUpperCase(), key: `day_${i}`, width: 24 }))
            ];

            // Style Header
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFDC143C' } // Crimson Red (BKS Kırmızı)
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
        // Populate Sheets depending on Group
        if (group === "REFEREE") {
            const formattedFormsMap = new Map<string, typeof allForms>();
            allForms.forEach(form => {
                if (form.referee) {
                    const formatted = formatClassification(form.referee.classification);
                    if (!formattedFormsMap.has(formatted)) formattedFormsMap.set(formatted, []);
                    formattedFormsMap.get(formatted)!.push(form);
                }
            });

            if (allForms.length > 0) addDataSheet("HEPSİ", allForms);

            const classOrder = ["A Klasmanı", "B Klasmanı", "C Klasmanı", "İl Hakemi", "Aday Hakem", "Bölge Hakemi", "Ulusal Hakem", "FIBA Hakemi"];

            // First, add sheets in the preferred order
            classOrder.forEach(label => {
                const forms = formattedFormsMap.get(label);
                if (forms && forms.length > 0) {
                    addDataSheet(label, forms);
                }
            });

            // Then, add any other sheets that weren't in the preferred order
            Array.from(formattedFormsMap.keys()).forEach(key => {
                if (!classOrder.includes(key)) {
                    // Avoid overlapping with existing sheets
                    addDataSheet(key.substring(0, 31), formattedFormsMap.get(key)!);
                }
            });

        } else if (group === "GENERAL") {
            const officialsMap = new Map<string, typeof allForms>();
            const addToMap = (sheetName: string, form: any) => {
                if (!officialsMap.has(sheetName)) officialsMap.set(sheetName, []);
                officialsMap.get(sheetName)!.push(form);
            };

            allForms.forEach(form => {
                if (form.official) {
                    const t = form.official.officialType;
                    if (t === "TABLE") addToMap("Masa Görevlisi", form);
                    else if (t === "OBSERVER") addToMap("Gözlemci", form);
                    else if (t === "STATISTICIAN") addToMap("İstatistik Görevlisi", form);
                    else if (t === "HEALTH") addToMap("Sağlık Görevlisi", form);
                    else if (t === "FIELD_COMMISSIONER") addToMap("Saha Komiseri", form);
                    else if (t === "TABLE_HEALTH") {
                        addToMap("Masa Görevlisi", form);
                        addToMap("Sağlık Görevlisi", form);
                    }
                    else if (t === "TABLE_STATISTICIAN") {
                        addToMap("Masa Görevlisi", form);
                        addToMap("İstatistik Görevlisi", form);
                    } else {
                        addToMap(formatOfficialType(t), form);
                    }
                }
            });

            if (allForms.length > 0) addDataSheet("HEPSİ", allForms);

            const officialOrder = ["Gözlemci", "Masa Görevlisi", "Saha Komiseri", "İstatistik Görevlisi", "Sağlık Görevlisi"];
            officialOrder.forEach(label => {
                const forms = officialsMap.get(label);
                if (forms && forms.length > 0) {
                    addDataSheet(label, forms);
                }
            });

            Array.from(officialsMap.keys()).forEach(key => {
                if (!officialOrder.includes(key)) {
                    addDataSheet(key.substring(0, 31), officialsMap.get(key)!);
                }
            });
        }

        if (workbook.worksheets.length === 0) {
            workbook.addWorksheet("Kayıt Yok");
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        const dateStr = startDate.toISOString().split('T')[0];
        let filename = "";
        if (group === "GENERAL") {
            filename = `BKG_Genel_Gorevliler_Uygunluk_Listesi_${dateStr}.xlsx`;
        } else {
            filename = `BKS_Hakem_Uygunluk_Listesi_${dateStr}.xlsx`;
        }

        return new NextResponse(nodeBuffer, {
            headers: {
                "Content-Length": nodeBuffer.byteLength.toString(),
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`
            }
        });
    } catch (error) {
        console.error("Excel generation error:", error);
        return NextResponse.json({ error: "Excel dosyası oluşturulurken bir hata oluştu." }, { status: 500 });
    }
}

