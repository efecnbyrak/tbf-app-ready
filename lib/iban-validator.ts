/**
 * Validates a Turkish IBAN using the official Mod-97 algorithmic format.
 * - Must be exactly 26 characters.
 * - Must start with 'TR'.
 * - Calculates the remainder when divided by 97. If the remainder is 1, the IBAN is valid.
 */
export function isValidTurkishIBAN(iban: string): boolean {
    // 1. Basic formatting (remove spaces, convert to uppercase)
    const formatted = iban.replace(/\s+/g, '').toUpperCase();

    // 2. Length check (Turkey IBAN is exactly 26 characters)
    if (formatted.length !== 26) {
        return false;
    }

    // 3. Prefix check
    if (!formatted.startsWith('TR')) {
        return false;
    }

    // 4. Move the first 4 characters to the end
    const rearranged = formatted.slice(4) + formatted.slice(0, 4);

    // 5. Convert letters to numeric values (A=10, B=11 ... Z=35)
    let numericIBAN = '';
    for (let i = 0; i < rearranged.length; i++) {
        const charCode = rearranged.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) { // 0-9
            numericIBAN += rearranged[i];
        } else if (charCode >= 65 && charCode <= 90) { // A-Z
            numericIBAN += (charCode - 55).toString();
        } else {
            return false; // Invalid character found
        }
    }

    // 6. Calculate Mod-97 using string chunking (JavaScript numbers cannot hold 26+ digits precisely)
    let remainder = 0;
    for (let i = 0; i < numericIBAN.length; i++) {
        const digit = parseInt(numericIBAN[i], 10);
        remainder = (remainder * 10 + digit) % 97;
    }

    // 7. Mod 97 MUST equal 1 for a mathematically valid IBAN
    return remainder === 1;
}
