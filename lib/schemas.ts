import { z } from "zod";
import { validateTCKN } from "@/lib/validation-utils";
import { isValidTurkishIBAN } from "@/lib/iban-validator";

export const LoginSchema = z.object({
    identifier: z.string().min(1, "TCKN veya Kullanıcı Adı gereklidir."),
    password: z.string().min(1, "Şifre gereklidir."),
    adminLogin: z.boolean().optional(),
});

export const RegisterSchema = z.object({
    firstName: z.string()
        .min(2, "Ad en az 2 karakter olmalıdır.")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Ad sadece harflerden oluşmalıdır."),
    lastName: z.string()
        .min(2, "Soyad en az 2 karakter olmalıdır.")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, "Soyad sadece harflerden oluşmalıdır."),
    tckn: z.string()
        .length(11, "TCKN 11 haneli olmalıdır.")
        .regex(/^\d+$/, "TCKN sadece rakamlardan oluşmalıdır.")
        .refine((val) => validateTCKN(val), "Geçersiz TC Kimlik Numarası."),
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
    password: z.string()
        .min(8, "Şifre en az 8 karakter olmalıdır.")
        .regex(/[a-z]/, "Şifre en az bir küçük harf içermelidir.")
        .regex(/[A-Z]/, "Şifre en az bir büyük harf içermelidir.")
        .regex(/[0-9]/, "Şifre en az bir rakam içermelidir."),
    roleType: z.string().min(1, "Görev seçimi gereklidir."),
    job: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    iban: z.string()
        .optional()
        .refine((val) => {
            if (!val) return true; // Optional during registration
            return val.length === 26 && isValidTurkishIBAN(val);
        }, "Geçersiz IBAN formatı (TR ile başlayan 26 karakter olmalıdır)."),
    kvkk: z.boolean().refine(val => val === true, "KVKK onayı zorunludur."),
});

export const PasswordResetRequestSchema = z.object({
    identifier: z.string().min(1, "TCKN veya Kullanıcı Adı gereklidir."),
});

export const PasswordResetSchema = z.object({
    token: z.string().min(1, "Geçersiz token."),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
    passwordConfirm: z.string()
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Şifreler eşleşmiyor.",
    path: ["passwordConfirm"],
});
