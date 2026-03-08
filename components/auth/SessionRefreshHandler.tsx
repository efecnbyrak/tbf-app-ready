"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SessionRefreshHandler() {
    const router = useRouter();
    const isRefreshing = useRef(false);

    useEffect(() => {
        // Only run on client
        if (typeof window === "undefined") return;

        const checkSession = async () => {
            if (isRefreshing.current) return;

            try {
                const res = await fetch("/api/auth/force-refresh");
                if (res.ok) {
                    const data = await res.json();
                    if (data.refreshRequired) {
                        isRefreshing.current = true;
                        console.log("[FORCE_REFRESH] Role change detected, refreshing page...");
                        // Use window.location.reload() for a hard refresh
                        window.location.reload();
                    }
                }
            } catch (error) {
                // Silent error in polling
            }
        };

        // Poll every 10 seconds
        const interval = setInterval(checkSession, 10000);

        // Visibility change check - run immediately when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                checkSession();
            }
        };
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [router]);

    return null; // Invisible component
}
