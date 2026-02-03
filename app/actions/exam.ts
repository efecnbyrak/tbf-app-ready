"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Get random questions for an exam (20 questions from the pool)
export async function getRandomQuestions() {
    try {
        const allQuestions = await db.question.findMany();

        if (allQuestions.length < 20) {
            return {
                success: false,
                error: "Soru havuzunda yeterli soru yok. En az 20 soru gerekli."
            };
        }

        // Shuffle and take 20 questions
        const shuffled = allQuestions.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 20);

        return { success: true, questions: selectedQuestions };
    } catch (error: any) {
        console.error("Error fetching random questions:", error);

        let errorMessage = "Sorular yüklenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'questions' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Submit exam answers
export async function submitExam(
    refereeId: number,
    answers: Array<{ questionId: number; questionText: string; selectedAnswer: string; correctAnswer: string }>
) {
    try {
        // Calculate score
        const correctCount = answers.filter(a => a.selectedAnswer === a.correctAnswer).length;

        // Create exam attempt with answers
        const attempt = await db.examAttempt.create({
            data: {
                refereeId,
                score: correctCount,
                totalQuestions: answers.length,
                answers: {
                    create: answers.map(a => ({
                        questionId: a.questionId,
                        questionText: a.questionText,
                        selectedAnswer: a.selectedAnswer,
                        correctAnswer: a.correctAnswer,
                        isCorrect: a.selectedAnswer === a.correctAnswer,
                    })),
                },
            },
            include: {
                answers: true,
            },
        });

        revalidatePath("/referee/results");
        return { success: true, attempt };
    } catch (error: any) {
        console.error("Error submitting exam:", error);

        let errorMessage = "Sınav gönderilirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'exam_attempts' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Get user's exam history
export async function getUserExamHistory(refereeId: number) {
    try {
        const attempts = await db.examAttempt.findMany({
            where: { refereeId },
            include: {
                answers: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return { success: true, attempts };
    } catch (error: any) {
        console.error("Error fetching exam history:", error);

        let errorMessage = "Sınav geçmişi yüklenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'exam_attempts' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}

// Get specific exam attempt details
export async function getExamAttemptDetails(attemptId: number) {
    try {
        const attempt = await db.examAttempt.findUnique({
            where: { id: attemptId },
            include: {
                answers: true,
                referee: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!attempt) {
            return { success: false, error: "Sınav denemesi bulunamadı." };
        }

        return { success: true, attempt };
    } catch (error: any) {
        console.error("Error fetching exam attempt details:", error);

        let errorMessage = "Sınav detayları yüklenirken bir hata oluştu.";
        if (error.code === 'P2021') {
            errorMessage = "Hata: Veritabanında 'exam_attempts' tablosu bulunamadı. Lütfen 'npx prisma db push' komutunu çalıştırın.";
        } else if (error.message) {
            errorMessage = `Hata: ${error.message}`;
        }

        return { success: false, error: errorMessage };
    }
}
