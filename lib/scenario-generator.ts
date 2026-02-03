// Scenario Generator for Referee Training

export interface RefereeScenario {
    id: string;
    playerNumber: number;
    clockType: string;
    scenarioType: 'FOUL' | 'VIOLATION';
    foulType?: string;
    violationType?: string;
    isOnShot?: boolean;
    shotType?: string;
    shotResult?: string;
    freeThrows?: number;
    gameDirection: string;
}

// Basketball game data
const playerNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

const clockTypes = ["Faul Saati Durdurma", "Oyun Saati Durdurma"];

const gameDirections = ["Oyun Yönü: Sağ", "Oyun Yönü: Sol", "Oyun Yönü: Rakip Potaya Doğru"];

const violationTypes = [
    "3 Saniye",
    "5 Saniye",
    "8 Saniye",
    "24 Saniye İhlali",
    "Geri Saha",
    "Topa Müdahale",
    "Kural Dışı Dripling",
    "Çift Dripling",
    "Top Taşıma",
    "Sınır Çizgisine Basma"
];

const foulTypes = [
    "İtme (Charge / Push)",
    "Elle Kontrol",
    "Bileğe Vurma",
    "Kural Dışı Perdeleme",
    "Topla Birlikte Şarj",
    "Sportmenlik Dışı",
    "Teknik Faul",
    "Dirsek Teması"
];

const shotTypes = ["2 sayılık", "3 sayılık"];
const shotResults = ["Sayı oldu", "Sayı olmadı (kaçtı)"];

// Helper to get random element from array
function getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

// Generate a single scenario
function generateSingleScenario(id: string): RefereeScenario {
    const scenarioType = Math.random() > 0.5 ? 'FOUL' : 'VIOLATION';
    const playerNumber = getRandomElement(playerNumbers);
    const clockType = getRandomElement(clockTypes);
    const gameDirection = getRandomElement(gameDirections);

    if (scenarioType === 'VIOLATION') {
        return {
            id,
            playerNumber,
            clockType,
            scenarioType,
            violationType: getRandomElement(violationTypes),
            gameDirection,
        };
    } else {
        // FOUL scenario
        const isOnShot = Math.random() > 0.5;
        let freeThrows = 0;
        let shotType: string | undefined;
        let shotResult: string | undefined;

        if (isOnShot) {
            shotType = getRandomElement(shotTypes);
            shotResult = getRandomElement(shotResults);

            // Determine free throws based on shot type and result
            if (shotResult === "Sayı oldu") {
                freeThrows = 1; // And-one
            } else {
                freeThrows = shotType === "3 sayılık" ? 3 : 2;
            }
        } else {
            // Not on shot - team foul situation
            // Simplified: 2 free throws for common fouls
            freeThrows = 2;
        }

        return {
            id,
            playerNumber,
            clockType,
            scenarioType,
            foulType: getRandomElement(foulTypes),
            isOnShot,
            shotType,
            shotResult,
            freeThrows,
            gameDirection,
        };
    }
}

// Generate multiple scenarios
export function generateScenarios(count: number = 5): RefereeScenario[] {
    const scenarios: RefereeScenario[] = [];

    for (let i = 0; i < count; i++) {
        scenarios.push(generateSingleScenario(`scenario-${Date.now()}-${i}`));
    }

    return scenarios;
}

// Format scenario for display
export function formatScenario(scenario: RefereeScenario): string {
    let output = `===== YENİ HAKEM SENARYOSU =====\n`;
    output += `1. Oyuncu: ${scenario.playerNumber} numaralı oyuncu\n`;
    output += `2. Saat Türü: ${scenario.clockType}\n`;

    if (scenario.scenarioType === 'VIOLATION') {
        output += `3. İhlal Türü: ${scenario.violationType}\n`;
    } else {
        output += `3. Faul Türü: ${scenario.foulType}\n`;
        if (scenario.isOnShot) {
            output += `   - Atış halinde mi? Evet\n`;
            output += `   - Atış Türü: ${scenario.shotType}\n`;
            output += `   - Atış sonucu: ${scenario.shotResult}\n`;
        } else {
            output += `   - Atış halinde mi? Hayır\n`;
        }
        output += `4. Serbest Atış Sayısı: ${scenario.freeThrows}\n`;
    }

    output += `${scenario.scenarioType === 'VIOLATION' ? '4' : '5'}. ${scenario.gameDirection}\n`;

    return output;
}
