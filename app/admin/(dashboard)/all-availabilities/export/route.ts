import { db } from "@/lib/db";
import { verifySession } from "@/lib/session";
import { getAvailabilityWindow } from "@/lib/availability-utils";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { formatClassification, formatOfficialType } from "@/lib/format-utils";
import { sortForms, SHORT_CLASSIFICATION_LABEL } from "@/lib/availability-sort";

export const runtime = "nodejs";

export async function GET(request: Request) {
    const session = await verifySession();
    if (session.role !== "SUPER_ADMIN" && session.role !== "ADMIN" && session.role !== "ADMIN_IHK") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const group = (searchParams.get("group") || "REFEREE") as "REFEREE" | "GENERAL";
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

    // 2. Fetch DATA
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

    // Sıralama: Klasman → A-Z isim
    const sortedForms = sortForms(allForms, group);

    // 3. Generate Excel
    try {
        const workbook = new ExcelJS.Workbook();

        const addDataSheet = async (sheetName: string, data: typeof allForms) => {
            const worksheet = workbook.addWorksheet(sheetName);

            // Yatay (landscape) sayfa yapısı, A4, tek sayfaya sığdır
            worksheet.pageSetup = {
                orientation: "landscape",
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                paperSize: 9, // A4
            };

            // Tarih başlıkları
            const dateHeaders: string[] = [];
            for (let i = 0; i < 7; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const weekday = d.toLocaleDateString("tr-TR", { weekday: "long" });
                const dateStr = d.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" });
                dateHeaders.push(`${weekday} ${dateStr}`);
            }

            // Kolon tanımları — Hakemler ve Genel Görevliler farklı
            if (group === "REFEREE") {
                worksheet.columns = [
                    { header: "AD SOYAD", key: "name", width: 45 },
                    { header: "KLASMAN", key: "class", width: 18 },
                    { header: "BÖLGELER", key: "regions", width: 30 },
                    ...dateHeaders.map((dh, i) => ({ header: dh.toUpperCase(), key: `day_${i}`, width: 24 }))
                ];
            } else {
                worksheet.columns = [
                    { header: "AD SOYAD", key: "name", width: 45 },
                    { header: "GÖREV", key: "officialType", width: 22 },
                    { header: "BÖLGELER", key: "regions", width: 30 },
                    ...dateHeaders.map((dh, i) => ({ header: dh.toUpperCase(), key: `day_${i}`, width: 24 }))
                ];
            }

            // Header satırı stili
            const headerRow = worksheet.getRow(1);
            headerRow.height = 50;
            headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 14 };
            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFDC143C" }
            };
            headerRow.alignment = { vertical: "middle", horizontal: "center" };

            // Veri satırları
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

                const rowData: any = {
                    name: `${ref.firstName} ${ref.lastName}`.toLocaleUpperCase("tr-TR"),
                    regions: regions
                };

                if (group === "REFEREE") {
                    const fullLabel = formatClassification((ref as any).classification);
                    rowData.class = SHORT_CLASSIFICATION_LABEL[fullLabel] ?? fullLabel;
                } else {
                    rowData.officialType = oTypeLabel;
                }

                for (let i = 0; i < 7; i++) {
                    const d = new Date(startDate);
                    d.setDate(startDate.getDate() + i);
                    const dayId = d.toISOString().split("T")[0];
                    const dayRecord = form.days.find(fd => fd.date.toISOString().split("T")[0] === dayId);

                    if (dayRecord) {
                        let slots = dayRecord.slots;
                        if (slots) {
                            slots = slots.replace(/\s+(Sonrası|Öncesi|İtibaren|Arası)/gi, "");
                            slots = slots.split(",")
                                .map(s => s.trim())
                                .filter(s => s !== "18:00")
                                .join(", ");
                        }
                        rowData[`day_${i}`] = slots || "-";
                    } else {
                        rowData[`day_${i}`] = "-";
                    }
                }

                worksheet.addRow(rowData);

                if (index % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }

            // Veri satırları stili
            worksheet.eachRow((row, rowNumber) => {
                const isEvenRow = rowNumber > 1 && rowNumber % 2 === 0;

                row.eachCell((cell, colNumber) => {
                    cell.border = {
                        top: { style: "thin" },
                        left: { style: "thin" },
                        bottom: { style: "thin" },
                        right: { style: "thin" }
                    };

                    if (rowNumber > 1) {
                        cell.font = { size: 14 };

                        if (isEvenRow) {
                            cell.fill = {
                                type: "pattern",
                                pattern: "solid",
                                fgColor: { argb: "FFF2F2F2" }
                            };
                        }

                        // Gün sütunları ortalı; diğerleri sola
                        const fixedCols = group === "REFEREE" ? 3 : 3; // AD SOYAD + KLASMAN/GÖREV + BÖLGELER
                        if (colNumber > fixedCols) {
                            cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
                        } else {
                            cell.alignment = { vertical: "middle", wrapText: false };
                        }
                    }
                });

                if (rowNumber > 1) row.height = 50;
            });
        };

        // Sheet'leri grup bazında oluştur
        if (group === "REFEREE") {
            const formattedFormsMap = new Map<string, typeof allForms>();
            sortedForms.forEach(form => {
                if (form.referee) {
                    const formatted = formatClassification(form.referee.classification);
                    if (!formattedFormsMap.has(formatted)) formattedFormsMap.set(formatted, []);
                    formattedFormsMap.get(formatted)!.push(form);
                }
            });

            if (sortedForms.length > 0) await addDataSheet("HEPSİ", sortedForms);

            const classOrder = ["A Klasmanı", "B Klasmanı", "C Klasmanı", "İl Hakemi", "Aday Hakem", "Bölge Hakemi", "Ulusal Hakem", "FIBA Hakemi"];
            for (const label of classOrder) {
                const forms = formattedFormsMap.get(label);
                if (forms && forms.length > 0) {
                    const sheetName = SHORT_CLASSIFICATION_LABEL[label] ?? label.substring(0, 31);
                    await addDataSheet(sheetName, forms);
                }
            }
            for (const key of Array.from(formattedFormsMap.keys())) {
                if (!classOrder.includes(key)) {
                    const sheetName = SHORT_CLASSIFICATION_LABEL[key] ?? key.substring(0, 31);
                    await addDataSheet(sheetName, formattedFormsMap.get(key)!);
                }
            }

            // Bölge sheet'leri
            const regionNames = ["Avrupa", "Anadolu", "BGM"];
            for (const regionName of regionNames) {
                const regionForms = sortedForms.filter(form => {
                    const ref = form.referee || form.official;
                    return ref?.regions?.some((r: any) => r.name === regionName);
                });
                if (regionForms.length > 0) {
                    await addDataSheet(regionName, regionForms);
                }
            }

        } else if (group === "GENERAL") {
            const officialsMap = new Map<string, typeof allForms>();
            const addToMap = (sheetName: string, form: any) => {
                if (!officialsMap.has(sheetName)) officialsMap.set(sheetName, []);
                officialsMap.get(sheetName)!.push(form);
            };

            sortedForms.forEach(form => {
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

            if (sortedForms.length > 0) await addDataSheet("HEPSİ", sortedForms);

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

            // Bölge sheet'leri
            const regionNames = ["Avrupa", "Anadolu", "BGM"];
            for (const regionName of regionNames) {
                const regionForms = sortedForms.filter(form => {
                    const ref = form.referee || form.official;
                    return ref?.regions?.some((r: any) => r.name === regionName);
                });
                if (regionForms.length > 0) {
                    await addDataSheet(regionName, regionForms);
                }
            }
        }

        if (workbook.worksheets.length === 0) {
            workbook.addWorksheet("Kayıt Yok");
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const nodeBuffer = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

        const dateStr = startDate.toISOString().split("T")[0];
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
