

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

/**
 * Şifre gücü hesaplama (Score 0-4)
 */
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    if (!password) return { score: 0, label: "Geçersiz", color: "bg-zinc-200" };

    let score = 0;

    // Uzunluk kontrolü
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Karakter çeşitliliği
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (hasLower && hasUpper) score++;
    if (hasNumber || hasSpecial) score++;

    // Olumsuz durumlar (Ardışık 4 karakter aynı mı? "4444")
    const hasRepeated = /(.)\1{3,}/.test(password);
    if (hasRepeated && score > 1) score--;

    const levels = [
        { label: "Çok Zayıf", color: "bg-red-500" },
        { label: "Zayıf", color: "bg-orange-500" },
        { label: "Normal", color: "bg-yellow-500" },
        { label: "İyi", color: "bg-blue-500" },
        { label: "Güçlü", color: "bg-emerald-500" }
    ];

    const result = levels[Math.min(score, 4)];
    return { score, ...result };
}

/**
 * İsmi sadece harflere filtreler
 */
export function filterOnlyLetters(value: string): string {
    return value.replace(/[^a-zA-ZğüşıöçĞÜŞİÖÇ\s]/g, '');
}

/**
 * TR IBAN Doğrulama Algoritması
 */
export function validateIBAN(iban: string): boolean {
    // Boşlukları temizle ve büyük harfe çevir
    const cleanIBAN = iban.replace(/\s+/g, '').toUpperCase();

    // TR ile başlamalı ve 26 hane olmalı
    if (!/^TR\d{24}$/.test(cleanIBAN)) return false;

    // Algoritma: İlk 4 karakteri sona at (TRXX -> XXTR)
    // Harfleri sayıya çevir (A=10, B=11, ..., T=29, R=27) -> T=29, R=27
    // TR -> 2927
    const rearranged = cleanIBAN.substring(4) + "2927" + cleanIBAN.substring(2, 4);

    // Büyük sayı modu (BigInt kullanarak
    try {
        // @ts-ignore - BigInt is available in ES2020+
        const ibanNumber = BigInt(rearranged);
        return ibanNumber % BigInt(97) === BigInt(1);
    } catch {
        // Fallback: Manually compute mod 97 if BigInt fails
        let remainder = 0;
        for (let i = 0; i < rearranged.length; i += 7) {
            const chunk = remainder.toString() + rearranged.substring(i, i + 7);
            remainder = parseInt(chunk) % 97;
        }
        return remainder === 1;
    }
}
