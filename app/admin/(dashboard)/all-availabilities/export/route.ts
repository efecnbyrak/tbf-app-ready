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
    const week = searchParams.get("week");

    const { startDate: currentStartDate } = await getAvailabilityWindow();
    let startDate = currentStartDate;

    if (week === "last") {
        startDate = new Date(currentStartDate);
        startDate.setDate(currentStartDate.getDate() - 7);
    }

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
    // Use a date range to avoid timezone-induced exact-match failures.
    // The startDate from getAvailabilityWindow is a Saturday at 00:00 local time.
    // Forms may have been stored with a slightly different UTC offset.
    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(startDate);
    rangeEnd.setHours(23, 59, 59, 999);

    const formsFilter: any = {
        weekStartDate: {
            gte: rangeStart,
            lte: rangeEnd
        }
    };
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
        const addDataSheet = async (sheetName: string, data: typeof allForms) => {
            const worksheet = workbook.addWorksheet(sheetName);

            // Prepare Headers based on Dates
            const dateHeaders: string[] = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const weekday = d.toLocaleDateString('tr-TR', { weekday: 'long' });
                const dateStr = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
                dateHeaders.push(`${weekday} ${dateStr}`);
            }

            worksheet.columns = [
                { header: 'AD SOYAD', key: 'name', width: 45 },
                { header: 'GÖREV', key: 'officialType', width: 22 },
                { header: 'KLASMAN', key: 'class', width: 18 },
                { header: 'TELEFON', key: 'phone', width: 18 },
                { header: 'BÖLGELER', key: 'regions', width: 40 },
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
            for (let index = 0; index < data.length; index++) {
                const form = data[index];
                const isOff = !!form.official;
                const ref = form.referee || form.official;
                if (!ref) continue;

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

                const formatPhone = (phone: string | null | undefined) => {
                    if (!phone) return "-";
                    const digits = phone.replace(/\D/g, '');
                    if (digits.length === 11 && digits.startsWith('0')) {
                        // 05321234567 → 0532 123 45 67
                        return `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
                    } else if (digits.length === 10) {
                        // 5321234567 → 0532 123 45 67
                        return `0${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
                    } else if (digits.length === 12 && digits.startsWith('90')) {
                        // 905321234567 → 0532 123 45 67
                        const local = digits.substring(2);
                        return `0${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6, 8)} ${local.substring(8, 10)}`;
                    } else if (digits.length === 13 && digits.startsWith('090')) {
                        // 0905321234567 → 0532 123 45 67
                        const local = digits.substring(3);
                        return `0${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6, 8)} ${local.substring(8, 10)}`;
                    }
                    return phone;
                };

                const rowData: any = {
                    name: `${ref.firstName} ${ref.lastName}`.toLocaleUpperCase('tr-TR'),
                    officialType: oTypeLabel,
                    class: !isOff ? formatClassification((ref as any).classification) : "GÖREVLİ",
                    phone: formatPhone(ref.phone),
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
                
                // EVENT LOOP YIELDING FOR OOM PROTECTION
                if (index % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Styling adjustments for Data rows
            worksheet.eachRow((row, rowNumber) => {
                // Zebra striping: Light grey for even data rows
                const isEvenRow = rowNumber > 1 && rowNumber % 2 === 0;

                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    if (rowNumber > 1) {
                        if (isEvenRow) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFF2F2F2' } // Light Grey
                            };
                        }

                        if (colNumber >= 6) {
                            cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
                        } else {
                            // Name, type, class, phone, regions: no wrap so nothing gets cut off
                            cell.alignment = { vertical: 'middle', wrapText: false };
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

            if (allForms.length > 0) await addDataSheet("HEPSİ", allForms);

            const classOrder = ["A Klasmanı", "B Klasmanı", "C Klasmanı", "İl Hakemi", "Aday Hakem", "Bölge Hakemi", "Ulusal Hakem", "FIBA Hakemi"];

            // First, add sheets in the preferred order
            for (const label of classOrder) {
                const forms = formattedFormsMap.get(label);
                if (forms && forms.length > 0) {
                    await addDataSheet(label, forms);
                }
            }

            // Then, add any other sheets that weren't in the preferred order
            for (const key of Array.from(formattedFormsMap.keys())) {
                if (!classOrder.includes(key)) {
                    // Avoid overlapping with existing sheets
                    await addDataSheet(key.substring(0, 31), formattedFormsMap.get(key)!);
                }
            }

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

            if (allForms.length > 0) await addDataSheet("HEPSİ", allForms);

            const officialOrder = ["Gözlemci", "Masa Görevlisi", "Saha Komiseri", "İstatistik Görevlisi", "Sağlık Görevlisi"];
            
            for (const label of officialOrder) {
                const forms = officialsMap.get(label);
                if (forms && forms.length > 0) {
                    await addDataSheet(label, forms);
                }
            }

            for (const key of Array.from(officialsMap.keys())) {
                if (!officialOrder.includes(key)) {
                    await addDataSheet(key.substring(0, 31), officialsMap.get(key)!);
                }
            }
        }

        if (workbook.worksheets.length === 0) {
            workbook.addWorksheet("Kayıt Yok");
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        const dateStr = startDate.toISOString().split('T')[0];
        let filename = "";
        const weekPrefix = week === "last" ? "Gecen_Hafta_" : "";
        if (group === "GENERAL") {
            filename = `BKG_${weekPrefix}Genel_Gorevliler_Uygunluk_Listesi_${dateStr}.xlsx`;
        } else {
            filename = `BKS_${weekPrefix}Hakem_Uygunluk_Listesi_${dateStr}.xlsx`;
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

