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
/**
 * Formats a raw IBAN string into the Turkish format: TRXX XXXX XXXX XXXX XXXX XXXX XX
 * @param value Raw IBAN string
 * @returns Formatted IBAN string
 */
export function formatIBAN(value: string): string {
    const v = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    let raw = v;
    if (raw.length > 0 && !raw.startsWith("TR")) {
        raw = "TR" + raw;
    }
    const parts = [];
    for (let i = 0; i < raw.length && i < 26; i += 4) {
        parts.push(raw.substring(i, Math.min(i + 4, 26)));
    }
    return parts.join(" ");
}

/**
 * Formats a phone number string to ensure it starts with 0 and has exactly 11 digits.
 * @param value Raw phone number string
 * @returns Formatted phone number string or the original if invalid.
 */
export function formatPhone(value: string): string {
    // 1. Remove all non-digit characters
    const digitsOnly = value.replace(/\D/g, '');

    // 2. Check and format according to common Turkish patterns
    if (digitsOnly.length === 10 && digitsOnly.startsWith('5')) {
        // e.g. 5551234567 -> 05551234567
        return '0' + digitsOnly;
    } else if (digitsOnly.length === 11 && digitsOnly.startsWith('05')) {
        // e.g. 05551234567 -> 05551234567
        return digitsOnly;
    } else if (digitsOnly.length === 12 && digitsOnly.startsWith('905')) {
        // e.g. 905551234567 -> 05551234567
        return '0' + digitsOnly.substring(2);
    }

    // 3. Fallback: Return original value (or digits only) if it doesn't match expected patterns. 
    // We let normal form validation catch it if needed, or save best-effort if no strict validation.
    return value;
}

/**
 * Validates and formats an email address, ensuring it's lowercased, trimmed, and strictly adheres to standard email patterns.
 * Returns null if the email is invalid.
 * @param email Raw email string
 * @returns Formatted robust email or null.
 */
export function formatEmail(email: string | undefined | null): string | null {
    if (!email) return null;
    const trimmed = email.trim().toLowerCase();

    // Strict validation to avoid @.com, missing tld, space in email, multiple @, etc.
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailRegex.test(trimmed)) {
        return trimmed;
    }

    return null;
}
