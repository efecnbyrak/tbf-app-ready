import { CheckCircle2, CalendarCheck } from "lucide-react";

interface Props {
    existingForm: { days: { id: number; date: Date | string; slots: string }[] };
    startDate: Date;
    endDate: Date;
}

export function CurrentWeekSummary({ existingForm, startDate, endDate }: Props) {
    const sortedDays = [...existingForm.days].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const availableCount = sortedDays.filter(d => d.slots !== "Uygun Değil").length;

    return (
        <div className="mb-8 bg-green-50 dark:bg-green-950/30 border-2 border-green-200 dark:border-green-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 bg-green-600 rounded-2xl flex items-center justify-center shrink-0 shadow-md shadow-green-600/20">
                    <CalendarCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-green-800 dark:text-green-200 uppercase tracking-tight">
                        Bu Haftaki Uygunluğunuz
                    </h2>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {new Date(startDate).toLocaleDateString("tr-TR")} – {new Date(endDate).toLocaleDateString("tr-TR")}
                        <span className="ml-2 text-xs font-bold bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full border border-green-200 dark:border-green-800">
                            {availableCount} gün uygun
                        </span>
                    </p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase">Gönderildi</span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {sortedDays.map((day) => {
                    const d = new Date(day.date);
                    const isAvailable = day.slots !== "Uygun Değil";

                    return (
                        <div
                            key={day.id}
                            className={`p-3 rounded-2xl border text-sm transition-colors ${
                                isAvailable
                                    ? "bg-white dark:bg-zinc-900 border-green-200 dark:border-green-800 shadow-sm"
                                    : "bg-transparent border-zinc-200 dark:border-zinc-800 opacity-50"
                            }`}
                        >
                            <div className={`text-xs font-black uppercase mb-1 ${isAvailable ? "text-green-600 dark:text-green-400" : "text-zinc-400"}`}>
                                {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                            </div>
                            <div className={`text-sm font-semibold mb-1 ${isAvailable ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                                {d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                            </div>
                            <div className={`text-xs font-bold leading-tight ${isAvailable ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}`}>
                                {day.slots}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
