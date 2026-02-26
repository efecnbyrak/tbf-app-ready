"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from "recharts";

interface AdminDashboardChartsProps {
    registrationData: any[];
    classificationData: any[];
    regionData: any[];
}

const COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#eab308', '#ec4899'];

export function AdminDashboardCharts({ registrationData, classificationData, regionData }: AdminDashboardChartsProps) {
    return (
        <div className="flex flex-col gap-8 mt-8">
            {/* Main Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Registration Trend (Area Chart) */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">Kayıt Trendi</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase italic tracking-widest">Son 6 Ay / Kümülatif</p>
                        </div>
                        <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-red-600 rounded-lg flex items-end justify-center gap-0.5 p-1">
                                <div className="w-1 h-2 bg-red-600 rounded-sm"></div>
                                <div className="w-1 h-3 bg-red-600 rounded-sm"></div>
                                <div className="w-1 h-1 bg-red-600 rounded-sm"></div>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={registrationData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                                <XAxis
                                    dataKey="month"
                                    stroke="#71717a"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#71717a"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        color: '#fff',
                                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
                                    }}
                                    itemStyle={{ color: '#ef4444', fontWeight: 'bold' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#ef4444"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Classification Distribution (Pie Chart) */}
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">Klasman Dağılımı</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase italic tracking-widest">Hakem Seviyeleri</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-600 rounded-full"></div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={classificationData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={95}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationBegin={200}
                                    animationDuration={1500}
                                >
                                    {classificationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.1)" strokeWidth={2} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#18181b',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    align="center"
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '11px', paddingTop: '30px', fontWeight: 'bold', color: '#71717a' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Region Distribution (Bar Chart) */}
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight italic">Şehir Dağılımı</h3>
                        <p className="text-xs text-zinc-500 font-bold uppercase italic tracking-widest">En Fazla Üyeye Sahip 10 İl</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-2xl flex items-center justify-center text-purple-600 font-black">
                        7/24
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regionData} layout="vertical" margin={{ left: 30, right: 30 }}>
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="#71717a"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={100}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#8b5cf6"
                                radius={[0, 8, 8, 0]}
                                barSize={24}
                                animationDuration={1800}
                                label={{ position: 'right', fill: '#71717a', fontSize: 11, fontWeight: 'bold' }}
                            >
                                {regionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : '#8b5cf6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
