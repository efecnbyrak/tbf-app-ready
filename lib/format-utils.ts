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

/**
 * Formats a database classification key into a human-readable Turkish string.
 * @param classification The database classification key (e.g. 'ADAY_HAKEM')
 * @returns The formatted string (e.g. 'Aday Hakem') or the original key if not found.
 */
export function formatClassification(classification: string): string {
    return CLASSIFICATION_MAP[classification] || classification;
}
