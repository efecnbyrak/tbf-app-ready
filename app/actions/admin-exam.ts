"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Create a new question
export async function createQuestion(data: {
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    category?: string;
}) {
    try {
        const question = await db.question.create({
            data,
        });

        revalidatePath("/admin/questions");
        return { success: true, question };
    } catch (error: any) {
        console.error("Error creating question:", error);

        // Detailed error reporting for debugging
        let errorMessage = "Soru eklenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'questions' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Update a question
export async function updateQuestion(
    id: number,
    data: {
        questionText: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
        correctAnswer: string;
        category?: string;
    }
) {
    try {
        const question = await db.question.update({
            where: { id },
            data,
        });

        revalidatePath("/admin/questions");
        return { success: true, question };
    } catch (error: any) {
        console.error("Error updating question:", error);

        let errorMessage = "Soru güncellenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'questions' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Delete a question
export async function deleteQuestion(id: number) {
    try {
        await db.question.delete({
            where: { id },
        });

        revalidatePath("/admin/questions");
        return { success: true };
    } catch (error: any) {
        console.error("Error deleting question:", error);

        let errorMessage = "Soru silinirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'questions' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Get all questions
export async function getAllQuestions() {
    try {
        const questions = await db.question.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { success: true, questions };
    } catch (error: any) {
        console.error("Error fetching questions:", error);

        let errorMessage = "Sorular yüklenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'questions' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: true, questions: [], error: errorMessage }; // Return empty array on error but include message
    }
}

// Get all exam results (for admin)
export async function getAllExamResults() {
    try {
        const attempts = await db.examAttempt.findMany({
            include: {
                referee: {
                    select: {
                        firstName: true,
                        lastName: true,
                        tckn: true,
                        classification: true,
                    },
                },
                answers: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { success: true, attempts };
    } catch (error: any) {
        console.error("Error fetching exam results:", error);

        let errorMessage = "Sınav sonuçları yüklenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'exam_attempts' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}
