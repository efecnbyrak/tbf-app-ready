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
    } catch (error) {
        console.error("Error creating question:", error);
        return { success: false, error: "Soru eklenirken bir hata oluştu." };
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
    } catch (error) {
        console.error("Error updating question:", error);
        return { success: false, error: "Soru güncellenirken bir hata oluştu." };
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
    } catch (error) {
        console.error("Error deleting question:", error);
        return { success: false, error: "Soru silinirken bir hata oluştu." };
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
    } catch (error) {
        console.error("Error fetching questions:", error);
        return { success: false, error: "Sorular yüklenirken bir hata oluştu." };
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
    } catch (error) {
        console.error("Error fetching exam results:", error);
        return { success: false, error: "Sınav sonuçları yüklenirken bir hata oluştu." };
    }
}
