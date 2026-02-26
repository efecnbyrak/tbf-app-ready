import { z } from "zod";

export const LoginSchema = z.object({
    identifier: z.string().min(1, "TCKN veya Kullanıcı Adı gereklidir."),
    password: z.string().min(1, "Şifre gereklidir."),
    adminLogin: z.boolean().optional(),
});

export const RegisterSchema = z.object({
    firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır."),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır."),
    tckn: z.string().length(11, "TCKN 11 haneli olmalıdır.").regex(/^\d+$/, "TCKN sadece rakamlardan oluşmalıdır."),
    email: z.string().email("Geçerli bir e-posta adresi giriniz."),
    phone: z.string().min(10, "Geçerli bir telefon numarası giriniz."),
    password: z.string()
        .min(6, "Şifre en az 6 karakter olmalıdır."),
    roleType: z.string().min(1, "Görev seçimi gereklidir."),
    job: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
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
