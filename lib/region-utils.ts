export const ANADOLU_SIDE = [
    "Adalar", "Ataşehir", "Beykoz", "Çekmeköy", "Kadıköy", "Kartal", "Maltepe",
    "Pendik", "Sancaktepe", "Sultanbeyli", "Şile", "Tuzla", "Ümraniye", "Üsküdar"
];

export const AVRUPA_SIDE = [
    "Arnavutköy", "Avcılar", "Bağcılar", "Bahçelievler", "Bakırköy", "Başakşehir",
    "Bayrampaşa", "Beşiktaş", "Beylikdüzü", "Beyoğlu", "Büyükçekmece", "Çatalca",
    "Esenler", "Esenyurt", "Eyüpsultan", "Fatih", "Gaziosmanpaşa", "Güngören",
    "Kâğıthane", "Küçükçekmece", "Sarıyer", "Silivri", "Sultangazi", "Şişli", "Zeytinburnu"
];

const normalize = (str: string) =>
    str.toLocaleLowerCase('tr')
        .replace(/â/g, 'a')
        .replace(/î/g, 'i')
        .replace(/û/g, 'u')
        .trim();

export function getIstanbulSide(text: string | null): "Anadolu" | "Avrupa" | null {
    if (!text) return null;
    const normalizedText = normalize(text);

    // Check for exact district matches first (more accurate)
    for (const district of ANADOLU_SIDE) {
        if (normalizedText.includes(normalize(district))) return "Anadolu";
    }
    for (const district of AVRUPA_SIDE) {
        if (normalizedText.includes(normalize(district))) return "Avrupa";
    }

    // Fallback: Generic side terms
    if (normalizedText.includes("anadolu")) return "Anadolu";
    if (normalizedText.includes("avrupa")) return "Avrupa";

    return null;
}

export function formatLocation(regions: any[], address: string | null): string {
    if ((!regions || regions.length === 0) && !address) return "Belirtilmemiş";

    const sideFromRegions = regions?.map(r => getIstanbulSide(r.name)).find(s => s !== null);
    const sideFromAddress = getIstanbulSide(address);
    const finalSide = sideFromRegions || sideFromAddress;

    const isIstanbul = regions?.some(r => r.name === "İstanbul") ||
        (address?.toLocaleLowerCase('tr').includes("istanbul")) ||
        finalSide !== null;

    if (isIstanbul) {
        if (finalSide) return `İstanbul / ${finalSide}`;

        // If it's Istanbul but we don't know the side, try to show the district if available in regions
        const district = regions?.find((r: any) =>
            r.name !== "İstanbul" &&
            !["Avrupa", "Anadolu", "BGM"].includes(r.name)
        );
        if (district) return `İstanbul / ${district.name}`;

        return "İstanbul";
    }

    // Not Istanbul, show the city name from regions
    const city = regions?.find((r: any) => !["Avrupa", "Anadolu", "BGM"].includes(r.name)) || regions?.[0];
    return city?.name || "Belirtilmemiş";
}
