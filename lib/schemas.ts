import { z } from "zod";
import { isValidTurkishIBAN } from "@/lib/iban-validator";

export const LoginSchema = z.object({
    identifier: z.string().trim().min(1, "E-posta veya Kullanıcı Adı gereklidir."),
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
    securityQuestion: z.string().min(1, "Güvenlik sorusu seçimi gereklidir."),
    securityAnswer: z.string().min(2, "Güvenlik cevabı en az 2 karakter olmalıdır.")
        .regex(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s0-9]+$/, "Güvenlik cevabı sadece harf ve rakamlardan oluşmalıdır."),
    iban: z.string()
        .optional()
        .refine((val) => {
            if (!val) return true; // Optional during registration
            return val.length === 26 && isValidTurkishIBAN(val);
        }, "Geçersiz IBAN formatı (TR ile başlayan 26 karakter olmalıdır)."),
    kvkk: z.boolean().refine(val => val === true, "KVKK onayı zorunludur."),
});

export const PasswordResetRequestSchema = z.object({
    identifier: z.string().min(1, "E-posta Adresi gereklidir.").email("Geçerli bir E-posta adresi giriniz."),
});

export const PasswordResetSchema = z.object({
    token: z.string().min(1, "Geçersiz token."),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır."),
    passwordConfirm: z.string()
}).refine((data) => data.password === data.passwordConfirm, {
    message: "Şifreler eşleşmiyor.",
    path: ["passwordConfirm"],
});
