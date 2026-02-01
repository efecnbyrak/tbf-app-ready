import { z } from "zod";

export const LoginSchema = z.object({
    identifier: z.string().min(1, "Kullanıcı adı veya TCKN gereklidir."),
    password: z.string().min(1, "Şifre gereklidir."),
    role: z.enum(["REFEREE", "ADMIN"]),
});

export const RegisterSchema = z.object({
    firstName: z.string().min(2, "Ad en az 2 karakter olmalıdır"),
    lastName: z.string().min(2, "Soyad en az 2 karakter olmalıdır"),
    tckn: z.string().length(11, "TCKN 11 haneli olmalıdır").regex(/^[0-9]+$/, "TCKN sadece rakamlardan oluşmalıdır"),
    password: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    classification: z.string().min(1, "Klasman seçilmelidir"),
    region: z.string().min(1, "Bölge seçilmelidir"), // ID as string
    email: z.string().email().optional().or(z.literal("")),
    phone: z.string().optional(),
});

export const AvailabilitySchema = z.object({
    notes: z.string().max(500, "Notlar 500 karakteri geçmemelidir.").optional(),
    // Dynamic day slots are validated in the loop, but we can enforce structure here if needed.
});
