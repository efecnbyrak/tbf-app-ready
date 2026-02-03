"use client";

import { useState, useEffect } from "react";
import { generateScenarios, RefereeScenario } from "@/lib/scenario-generator";
import { ScenarioCard } from "@/components/referee/ScenarioCard";
import { RefreshCw, Sparkles } from "lucide-react";

export default function TrainingClient() {
    const [scenarios, setScenarios] = useState<RefereeScenario[]>([]);
    const [generating, setGenerating] = useState(false);

    // Clear scenarios when component unmounts or user navigates away
    useEffect(() => {
        return () => {
            setScenarios([]);
        };
    }, []);

    const handleGenerateScenarios = () => {
        setGenerating(true);

        // Small delay for better UX
        setTimeout(() => {
            const newScenarios = generateScenarios(5);
            setScenarios(newScenarios);
            setGenerating(false);
        }, 300);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    Hakem Eğitimi - Senaryo Üreteci
                </h1>
                <p className="text-zinc-600 dark:text-zinc-400">
                    Rastgele hakem senaryoları oluşturarak kendinizi geliştirin
                </p>
            </div>

            {/* Info Box */}
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900 dark:text-blue-100">
                        <p className="font-semibold mb-1">Nasıl Kullanılır?</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                            <li>Aşağıdaki butona tıklayarak 5 rastgele senaryo oluşturun</li>
                            <li>Her senaryoda faul veya ihlal durumunu inceleyin</li>
                            <li>Doğru hakem kararını ve işaretlemeyi düşünün</li>
                            <li>Yeni senaryolar için tekrar butona tıklayın</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Generate Button */}
            <div className="mb-6 text-center">
                <button
                    onClick={handleGenerateScenarios}
                    disabled={generating}
                    className={`px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-all ${generating
                            ? "bg-zinc-400 dark:bg-zinc-700 text-zinc-200 cursor-not-allowed"
                            : "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-xl transform hover:scale-105"
                        }`}
                >
                    {generating ? (
                        <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            Senaryolar Oluşturuluyor...
                        </span>
                    ) : scenarios.length > 0 ? (
                        <span className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5" />
                            Yeni Senaryolar Oluştur
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            Senaryolar Oluştur
                        </span>
                    )}
                </button>
            </div>

            {/* Scenarios Grid */}
            {scenarios.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {scenarios.map((scenario, index) => (
                        <ScenarioCard key={scenario.id} scenario={scenario} index={index} />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {scenarios.length === 0 && !generating && (
                <div className="bg-white dark:bg-zinc-900 rounded-lg shadow p-12 text-center border border-zinc-200 dark:border-zinc-800">
                    <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Sparkles className="w-10 h-10 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                        Senaryo Bekleniyor
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400">
                        Başlamak için yukarıdaki butona tıklayın
                    </p>
                </div>
            )}
        </div>
    );
}
