"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from "recharts";

interface AdminDashboardChartsProps {
    registrationData: any[];
    classificationData: any[];
    regionData: any[];
}

const COLORS = ['#ef4444', '#f97316', '#8b5cf6', '#10b981', '#3b82f6', '#eab308', '#ec4899'];

export function AdminDashboardCharts({ registrationData, classificationData, regionData }: AdminDashboardChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Registration Trend (Line Chart) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 italic">Kayıt Trendi (Aylık)</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={registrationData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis
                                dataKey="month"
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    color: '#fff'
                                }}
                                itemStyle={{ color: '#ef4444' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ fill: '#ef4444', r: 4 }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Classification Distribution (Pie Chart) */}
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 italic">Klasman Dağılımı</h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={classificationData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {classificationData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Regional Data (Bar Chart) - Full Width on Large Screens */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 p-6 rounded-[2rem] shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest mb-6 italic">En Yoğun Bölgeler (Şehirler)</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={regionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis
                                dataKey="name"
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#71717a"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: '#27272a', opacity: 0.4 }}
                                contentStyle={{
                                    backgroundColor: '#18181b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '12px'
                                }}
                            />
                            <Bar
                                dataKey="count"
                                fill="#ef4444"
                                radius={[6, 6, 0, 0]}
                                barSize={40}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
