// Classification formatting map
const CLASSIFICATION_MAP: Record<string, string> = {
    'ADAY_HAKEM': 'Aday Hakem',
    'İL_HAKEM': 'İl Hakemi',
    'IL_HAKEM': 'İl Hakemi',
    'BOLGE_HAKEM': 'Bölge Hakemi',
    'ULUSAL_HAKEM': 'Ulusal Hakem',
    'FIBA_HAKEM': 'FIBA Hakemi',
    'BELIRLENMEMIS': 'Belirlenmemiş',
    // Legacy support
    'A': 'A Klasmanı',
    'B': 'B Klasmanı',
    'C': 'C Klasmanı',
    'IL_HAKEMI': 'İl Hakemi'
};

// Official Type formatting map
const OFFICIAL_TYPE_MAP: Record<string, string> = {
    'REFEREE': 'Hakem',
    'TABLE': 'Masa Görevlisi',
    'OBSERVER': 'Gözlemci',
    'STATISTICIAN': 'İstatistik Görevlisi',
    'HEALTH': 'Sağlık Görevlisi',
    'FIELD_COMMISSIONER': 'Saha Komiseri',
    'TABLE_HEALTH': 'Masa & Sağlık',
    'TABLE_STATISTICIAN': 'Masa & İstatistik'
};

/**
 * Formats a database classification key into a human-readable Turkish string.
 * @param classification The database classification key (e.g. 'ADAY_HAKEM')
 * @returns The formatted string (e.g. 'Aday Hakem') or the original key if not found.
 */
export function formatClassification(classification: string): string {
    return CLASSIFICATION_MAP[classification] || classification;
}

/**
 * Formats a database official type key into a human-readable Turkish string.
 * @param type The database official type key (e.g. 'TABLE_HEALTH')
 * @returns The formatted string (e.g. 'Masa & Sağlık') or the original key if not found.
 */
export function formatOfficialType(type: string): string {
    return OFFICIAL_TYPE_MAP[type] || type;
}
