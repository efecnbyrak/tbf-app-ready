"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Get random questions for an exam (20 questions from the pool)
// Attempts to pick questions from various categories for a balanced exam
export async function getRandomQuestions(difficulty: string = "Orta") {
    try {
        const allQuestions = await db.question.findMany({
            where: {
                difficulty: difficulty
            }
        });

        if (allQuestions.length < 20) {
            return {
                success: false,
                error: `Soru havuzunda ${difficulty} seviyesinde yeterli soru yok. En az 20 soru gerekli. Mevcut soru sayısı: ${allQuestions.length}`
            };
        }

        // 1. Group questions by category
        const categorizedQuestions: Record<string, typeof allQuestions> = {};
        allQuestions.forEach(q => {
            const cat = q.category || "General";
            if (!categorizedQuestions[cat]) categorizedQuestions[cat] = [];
            categorizedQuestions[cat].push(q);
        });

        const categories = Object.keys(categorizedQuestions);
        const selectedQuestions: typeof allQuestions = [];
        const poolCopy = [...allQuestions];

        // 2. Try to pick at least one from each category if possible to ensure "her birinden" selection
        categories.forEach(cat => {
            if (selectedQuestions.length < 20) {
                const catPool = categorizedQuestions[cat];
                const randomIndex = Math.floor(Math.random() * catPool.length);
                const picked = catPool.splice(randomIndex, 1)[0];
                selectedQuestions.push(picked);

                // Remove from general pool copy as well
                const poolIndex = poolCopy.findIndex(q => q.id === picked.id);
                if (poolIndex > -1) poolCopy.splice(poolIndex, 1);
            }
        });

        // 3. Fill the rest randomly from the remaining pool
        while (selectedQuestions.length < 20 && poolCopy.length > 0) {
            const randomIndex = Math.floor(Math.random() * poolCopy.length);
            const picked = poolCopy.splice(randomIndex, 1)[0];
            selectedQuestions.push(picked);
        }

        // Final shuffle of the 20 selected questions
        const finalSelection = selectedQuestions.sort(() => Math.random() - 0.5);

        return { success: true, questions: finalSelection };
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
    answers: Array<{ questionId: number; questionText: string; selectedAnswer: string; correctAnswer: string }>,
    difficulty: string = "Orta"
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
                difficulty,
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
