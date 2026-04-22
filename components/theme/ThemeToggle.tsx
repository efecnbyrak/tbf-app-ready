"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
    const [theme, setTheme] = useState<"light" | "dark" | null>(null);

    useEffect(() => {
        const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
        setTheme(currentTheme);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "light" ? "dark" : "light";

        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(newTheme);
        localStorage.setItem("theme", newTheme);
        setTheme(newTheme);
    };

    if (!theme) return <div className="w-10 h-10" />;

    return (
        <button
            onClick={toggleTheme}
            className={`p-2.5 bg-zinc-700 hover:bg-red-600 text-zinc-300 hover:text-white rounded-lg transition-all shadow-inner active:scale-95 ${className}`}
            title={theme === "dark" ? "Açık Temaya Geç" : "Koyu Temaya Geç"}
        >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
    );
}
