import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { ensureSchemaColumns } from "@/app/actions/auth";
import { RegisterSchema } from "@/lib/schemas";
import { formatPhone } from "@/lib/validation-utils";

/**
 * POST /api/auth/register
 * 
 * Mobile-only REST endpoint for user registration.
 * Replicates the same validation and business logic as the web Server Action.
 * 
 * Body: { firstName, lastName, tckn, email, phone, password, roleType, job?, address?, city? }
 * 
 * Does NOT interfere with the existing web registration flow.
 */

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate with the same Zod schema used by the web
        const validatedFields = RegisterSchema.safeParse({
            ...body,
            kvkk: body.kvkk ?? true, // Mobile sends this as true if checkbox is checked
        });

        if (!validatedFields.success) {
            const fieldErrors = validatedFields.error.flatten().fieldErrors;
            const mappedErrors: Record<string, string> = {};

            (Object.keys(fieldErrors) as Array<keyof typeof fieldErrors>).forEach((key) => {
                const errorMsg = fieldErrors[key]?.[0];
                if (errorMsg) {
                    mappedErrors[key as string] = errorMsg;
                }
            });

            return NextResponse.json(
                { error: "Lütfen işaretli alanları kontrol edin.", errors: mappedErrors },
                { status: 400 }
            );
        }

        const { firstName, lastName, tckn, email, phone, password, roleType, job, address } = validatedFields.data;

        await ensureSchemaColumns();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check TCKN uniqueness
        const existingTckn = await db.user.findFirst({ where: { tckn } });
        if (existingTckn) {
            return NextResponse.json(
                { error: "Bu TCKN ile kayıtlı bir kullanıcı zaten var.", errors: { tckn: "Zaten kayıtlı." } },
                { status: 409 }
            );
        }

        // Check email uniqueness
        const existingRefereeEmail = await db.referee.findUnique({ where: { email } });
        const existingOfficialEmail = await db.generalOfficial.findUnique({ where: { email } });

        if (existingRefereeEmail || existingOfficialEmail) {
            return NextResponse.json(
                { error: "Bu E-posta zaten kullanımda.", errors: { email: "Zaten kayıtlı." } },
                { status: 409 }
            );
        }

        // Find/Create Role
        let refereeRole = await db.role.findUnique({ where: { name: "REFEREE" } });
        if (!refereeRole) {
            refereeRole = await db.role.create({ data: { name: "REFEREE" } });
        }

        const selectedCity = body.city || "İstanbul";

        // Transactional user + profile creation
        await db.$transaction(async (tx: any) => {
            const createdUser = await tx.user.create({
                data: {
                    username: tckn,
                    tckn,
                    password: hashedPassword,
                    roleId: refereeRole!.id,
                    isApproved: false,
                },
            });

            let region = await tx.region.findUnique({ where: { name: selectedCity } });
            if (!region) {
                region = await tx.region.create({ data: { name: selectedCity } });
            }

            if (roleType === "REFEREE") {
                await tx.referee.create({
                    data: {
                        userId: createdUser.id,
                        tckn,
                        firstName,
                        lastName,
                        email,
                        phone: formatPhone(phone),
                        classification: "BELIRLENMEMIS",
                        job: job || null,
                        address: address || null,
                        regions: { connect: { id: region.id } },
                    },
                });
            } else {
                await tx.generalOfficial.create({
                    data: {
                        userId: createdUser.id,
                        tckn,
                        firstName,
                        lastName,
                        email,
                        phone: formatPhone(phone),
                        officialType: roleType,
                        job: job || null,
                        address: address || null,
                        regions: { connect: { id: region.id } },
                    },
                });
            }
        });

        return NextResponse.json({
            success: true,
            message: "Kayıt başarılı! Başvurunuz Yönetici tarafından onay beklemektedir.",
        }, { status: 201 });

    } catch (error: any) {
        console.error("[API/REGISTER] Error:", error);
        return NextResponse.json(
            { error: "Kayıt işlemi sırasında bir hata oluştu." },
            { status: 500 }
        );
    }
}
