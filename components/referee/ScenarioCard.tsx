"use client";

import { RefereeScenario } from "@/lib/scenario-generator";
import { AlertCircle, Clock, User, Flag } from "lucide-react";

interface ScenarioCardProps {
    scenario: RefereeScenario;
    index: number;
}

export function ScenarioCard({ scenario, index }: ScenarioCardProps) {
    return (
        <div className="bg-gradient-to-br from-white to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 rounded-xl shadow-lg p-6 border-2 border-zinc-200 dark:border-zinc-700 hover:shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-red-200 dark:border-red-900">
                <h3 className="text-xl font-bold text-red-700 dark:text-red-400">
                    Senaryo #{index + 1}
                </h3>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${scenario.scenarioType === 'FOUL'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                    {scenario.scenarioType === 'FOUL' ? 'FAUL' : 'İHLAL'}
                </div>
            </div>

            {/* Scenario Details */}
            <div className="space-y-4">
                {/* Player Number */}
                <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Oyuncu</div>
                        <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                            {scenario.playerNumber} numaralı oyuncu
                        </div>
                    </div>
                </div>

                {/* Clock Type */}
                <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Saat Türü</div>
                        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {scenario.clockType}
                        </div>
                    </div>
                </div>

                {/* Foul or Violation Details */}
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                            {scenario.scenarioType === 'FOUL' ? 'Faul Türü' : 'İhlal Türü'}
                        </div>
                        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                            {scenario.scenarioType === 'FOUL' ? scenario.foulType : scenario.violationType}
                        </div>

                        {/* Shot Details (only for fouls) */}
                        {scenario.scenarioType === 'FOUL' && (
                            <div className="mt-3 pl-4 border-l-2 border-red-300 dark:border-red-700 space-y-1">
                                <div className="text-sm">
                                    <span className="text-zinc-600 dark:text-zinc-400">Atış halinde mi?</span>{" "}
                                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                        {scenario.isOnShot ? "Evet" : "Hayır"}
                                    </span>
                                </div>
                                {scenario.isOnShot && (
                                    <>
                                        <div className="text-sm">
                                            <span className="text-zinc-600 dark:text-zinc-400">Atış Türü:</span>{" "}
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                {scenario.shotType}
                                            </span>
                                        </div>
                                        <div className="text-sm">
                                            <span className="text-zinc-600 dark:text-zinc-400">Atış Sonucu:</span>{" "}
                                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                                {scenario.shotResult}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Free Throws (only for fouls) */}
                {scenario.scenarioType === 'FOUL' && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium mb-1">
                            Serbest Atış Sayısı
                        </div>
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                            {scenario.freeThrows}
                        </div>
                    </div>
                )}

                {/* Game Direction */}
                <div className="flex items-start gap-3">
                    <Flag className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">Oyun Yönü</div>
                        <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                            {scenario.gameDirection}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
