"use client";

import { useState } from "react";

interface QuizCardProps {
    questionNumber: number;
    questionText: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    questionType?: string;
    selectedAnswer?: string;
    onAnswerSelect: (answer: string) => void;
    showCorrect?: boolean;
    correctAnswer?: string;
}

export function QuizCard({
    questionNumber,
    questionText,
    optionA,
    optionB,
    optionC,
    optionD,
    questionType,
    selectedAnswer,
    onAnswerSelect,
    showCorrect = false,
    correctAnswer,
}: QuizCardProps) {
    const isFillInBlank = questionType === "FILL_IN_BLANK";

    const options = [
        { key: "A", value: optionA },
        { key: "B", value: optionB },
        { key: "C", value: optionC },
        { key: "D", value: optionD },
    ].filter(opt => opt.value !== "");

    const getOptionClass = (key: string) => {
        const baseClass = "w-full p-4 text-left border-2 rounded-lg transition-all cursor-pointer hover:shadow-md";

        if (showCorrect) {
            if (key === correctAnswer) {
                return `${baseClass} bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:text-green-100`;
            }
            if (key === selectedAnswer && key !== correctAnswer) {
                return `${baseClass} bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-100`;
            }
            return `${baseClass} bg-zinc-50 border-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400`;
        }

        if (selectedAnswer === key) {
            return `${baseClass} bg-red-100 border-red-600 text-red-900 shadow-md dark:bg-red-900/30 dark:border-red-500 dark:text-red-100`;
        }

        return `${baseClass} bg-white border-zinc-300 text-zinc-900 hover:border-red-400 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:hover:border-red-500`;
    };

    const fillIsCorrect = showCorrect && correctAnswer && selectedAnswer &&
        selectedAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-6 border border-zinc-200 dark:border-zinc-800">
            {/* Question Number */}
            <div className="flex items-center gap-2 mb-4">
                <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    Soru {questionNumber}
                </div>
                {isFillInBlank && (
                    <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-black rounded-full uppercase tracking-wide">
                        Boşluk Doldur
                    </span>
                )}
            </div>

            {/* Question Text */}
            <h3 className="text-lg md:text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100 leading-relaxed">
                {questionText}
            </h3>

            {/* Fill in blank input OR multiple choice options */}
            {isFillInBlank ? (
                <div className="space-y-3">
                    <input
                        type="text"
                        value={selectedAnswer || ""}
                        onChange={(e) => !showCorrect && onAnswerSelect(e.target.value)}
                        disabled={showCorrect}
                        placeholder="Cevabınızı buraya yazın..."
                        className={`w-full p-4 border-2 rounded-lg transition-all outline-none text-base ${
                            showCorrect
                                ? fillIsCorrect
                                    ? "bg-green-50 border-green-500 text-green-900 dark:bg-green-900/20 dark:text-green-100"
                                    : "bg-red-50 border-red-500 text-red-900 dark:bg-red-900/20 dark:text-red-100"
                                : "bg-white border-zinc-300 text-zinc-900 focus:border-red-600 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                        }`}
                    />
                    {showCorrect && (
                        <div className={`flex items-center gap-2 text-sm font-bold ${fillIsCorrect ? "text-green-600" : "text-red-600"}`}>
                            {fillIsCorrect ? "✓ Doğru!" : `✗ Doğru cevap: ${correctAnswer}`}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {options.map((option) => (
                        <button
                            key={option.key}
                            onClick={() => !showCorrect && onAnswerSelect(option.key)}
                            disabled={showCorrect}
                            className={getOptionClass(option.key)}
                        >
                            <div className="flex items-start gap-3">
                                <span className="font-bold text-red-600 dark:text-red-400 min-w-[24px]">
                                    {option.key})
                                </span>
                                <span className="flex-1">{option.value}</span>
                                {showCorrect && option.key === correctAnswer && (
                                    <span className="text-green-600 dark:text-green-400">✓</span>
                                )}
                                {showCorrect && option.key === selectedAnswer && option.key !== correctAnswer && (
                                    <span className="text-red-600 dark:text-red-400">✗</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
