"use client";

import { useState } from "react";

interface DayRowProps {
    index: number;
    dayName: string;
    dateString: string;
    initialSlot: string | null;
    isLocked: boolean;
}

const TIME_SLOTS = [
    "17:00",
    "18:30",
    "20:00",
    "09:00 - 16:00",
    "14:00 - 20:00"
] as const;

export function DayRow({ index, dayName, dateString, initialSlot, isLocked }: DayRowProps) {
    // Parse initial slots
    const parseInitialSlots = (): { isAvailable: boolean; selectedSlots: string[] } => {
        if (!initialSlot || initialSlot === "Uygun Değil") {
            return { isAvailable: false, selectedSlots: [] };
        }
        if (initialSlot === "Tüm Gün" || initialSlot === "UYGUNUM") {
            return { isAvailable: true, selectedSlots: [] };
        }
        // Parse time slots (can be multiple, comma-separated)
        const slots = initialSlot.split(',').map(s => s.trim());
        return { isAvailable: false, selectedSlots: slots };
    };

    const { isAvailable: initialIsAvailable, selectedSlots: initialSelectedSlots } = parseInitialSlots();

    const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
    const [selectedSlots, setSelectedSlots] = useState<string[]>(initialSelectedSlots);

    const handleAvailableChange = (checked: boolean) => {
        setIsAvailable(checked);
        if (checked) {
            // Clear all time slots when UYGUNUM is selected
            setSelectedSlots([]);
        }
    };

    const handleSlotChange = (slot: string, checked: boolean) => {
        if (checked) {
            setSelectedSlots(prev => [...prev, slot]);
        } else {
            setSelectedSlots(prev => prev.filter(s => s !== slot));
        }
    };

    // Generate value for hidden input
    const getValue = () => {
        if (isAvailable) return "UYGUNUM";
        if (selectedSlots.length === 0) return "Uygun Değil";
        return selectedSlots.join(", ");
    };

    return (
        <div className="flex flex-col gap-3 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {/* Day Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold text-lg">{dayName}</p>
                    <p className="text-sm text-zinc-500">{dateString}</p>
                </div>

                {/* UYGUNUM Checkbox - Prominent */}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all ${isAvailable
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-green-400'
                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                        type="checkbox"
                        checked={isAvailable}
                        onChange={(e) => handleAvailableChange(e.target.checked)}
                        disabled={isLocked}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-600"
                    />
                    <span className={`font-semibold ${isAvailable ? 'text-green-700 dark:text-green-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                        UYGUNUM
                    </span>
                </label>
            </div>

            {/* Time Slots Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {TIME_SLOTS.map((slot) => {
                    const isChecked = selectedSlots.includes(slot);
                    const isDisabled = isLocked || isAvailable;

                    return (
                        <label
                            key={slot}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${isChecked
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-sm'
                                : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 hover:border-red-400'
                                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                            <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleSlotChange(slot, e.target.checked)}
                                disabled={isDisabled}
                                className="w-4 h-4 text-red-600 rounded focus:ring-red-600"
                            />
                            <span className={`font-medium ${isChecked ? 'text-red-700 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                                {slot}
                            </span>
                        </label>
                    );
                })}
            </div>

            {/* Hidden input to send data */}
            <input type="hidden" name={`day_${index}_slot`} value={getValue()} />
        </div>
    );
}
