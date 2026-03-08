"use client";

import dynamic from 'next/dynamic';

const Charts = dynamic(
    () => import("./AdminDashboardCharts").then(mod => mod.AdminDashboardCharts),
    {
        ssr: false,
        loading: () => <div className="h-[400px] w-full bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded-[2.5rem]" />
    }
);

interface DashboardChartsWrapperProps {
    registrationData: any[];
    classificationData: any[];
}

export function DashboardChartsWrapper(props: DashboardChartsWrapperProps) {
    return <Charts {...props} />;
}
