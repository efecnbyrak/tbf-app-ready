/**
 * Profesyonel TC Kimlik Numarası Doğrulama Algoritması
 * Kurallar:
 * 1. 11 haneli olmalıdır.
 * 2. Her hanesi rakam olmalıdır.
 * 3. İlk hanesi 0 olamaz.
 * 4. 1, 3, 5, 7 ve 9. hanelerin toplamının 7 katından, 2, 4, 6 ve 8. hanelerin toplamı çıkartıldığında,
 *    elde edilen sonucun 10'a bölümünden kalan, 10. haneyi vermelidir.
 * 5. 1, 2, 3, 4, 5, 6, 7, 8, 9 ve 10. hanelerin toplamının 10'a bölümünden kalan, 11. haneyi vermelidir.
 */
export function validateTCKN(tckn: string): boolean {
    if (!/^[1-9]\d{10}$/.test(tckn)) return false;

    const digits = tckn.split('').map(Number);

    // 10. hane kontrolü
    const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
    const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
    const tenthDigit = ((oddSum * 7) - evenSum) % 10;

    if (tenthDigit < 0 ? tenthDigit + 10 !== digits[9] : tenthDigit !== digits[9]) return false;

    // 11. hane kontrolü
    const totalSum = digits.slice(0, 10).reduce((a, b) => a + b, 0);
    if (totalSum % 10 !== digits[10]) return false;

    return true;
}

/**
 * Profesyonel Telefon Numarası Doğrulama
 * Format: 5XX XXX XX XX (10 hane, başında 0 olmadan veya +90 olmadan)
 */
export function validatePhone(phone: string): boolean {
    // Sadece rakamları temizle
    const cleanPhone = phone.replace(/\D/g, '');

    // Türkiye GSM formatı: 5 ile başlamalı ve 10 hane olmalı
    // Eğer 11 hane ise ve 0 ile başlıyorsa ilk 0'ı at
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        finalPhone = cleanPhone.substring(1);
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('90')) {
        finalPhone = cleanPhone.substring(2);
    } else if (cleanPhone.length === 13 && cleanPhone.startsWith('+90')) {
        finalPhone = cleanPhone.substring(3);
    }

    return /^[5]\d{9}$/.test(finalPhone);
}

/**
 * Telefon numarasını standart formata getirir (5XX XXX XX XX)
 */
export function formatPhone(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');
    let finalPhone = cleanPhone;
    if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
        finalPhone = cleanPhone.substring(1);
    }

    if (finalPhone.length !== 10) return phone;

    return `${finalPhone.substring(0, 3)} ${finalPhone.substring(3, 6)} ${finalPhone.substring(6, 8)} ${finalPhone.substring(8, 10)}`;
}
