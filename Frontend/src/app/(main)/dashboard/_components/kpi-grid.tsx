
'use client';
import { KPICard } from "@/components/kpi-card";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Minus, Waves } from 'lucide-react';
import { cn } from "@/lib/utils";

const kpiData = [
  { name: 'First Call Resolution', value: '78%', target: '75-85%', change: 'increase' as const, chartData: [{ v: 0 }, { v: 20 }, { v: 10 }, { v: 40 }, { v: 50 }] },
  { name: 'Avg Call Duration', value: '6.2 min', target: '4-8 min', change: 'increase' as const, chartData: [{ v: 20 }, { v: 30 }, { v: 25 }, { v: 45 }, { v: 60 }] },
  { name: 'Abandonment Rate', value: '6.8%', target: '<8%', change: 'decrease' as const, chartData: [{ v: 50 }, { v: 40 }, { v: 60 }, { v: 30 }, { v: 20 }] },
  { name: 'Customer Satisfaction', value: '87%', target: '>85%', change: 'increase' as const, chartData: [{ v: 10 }, { v: 30 }, { v: 20 }, { v: 50 }, { v_80: 80 }] },
  { name: 'Customer Effort Score', value: '2.3', target: '<3.0', change: 'decrease' as const, chartData: [{ v: 60 }, { v: 50 }, { v: 40 }, { v: 30 }, { v: 20 }] },
  { name: 'Live Positive Sentiment', value: '68%', target: '≥65%', change: 'increase' as const, chartData: [{ v: 20 }, { v: 40 }, { v_30: 30 }, { v: 60 }, { v: 70 }] },
  { name: 'Cost per Contact', value: '₹4.20', target: '<₹5.60', change: 'decrease' as const, chartData: [{ v: 70 }, { v: 60 }, { v: 50 }, { v: 40 }, { v: 30 }] },
  { name: 'Agent Utilization', value: '82.4%', target: '75-85%', change: 'neutral' as const, chartData: [{ v: 40 }, { v: 50 }, { v: 45 }, { v: 55 }, { v: 50 }] },
];

const changeIcons = {
    increase: <TrendingUp className="w-4 h-4" />,
    decrease: <TrendingDown className="w-4 h-4" />,
    neutral: <Minus className="w-4 h-4" />
};

const changeColors = {
    increase: "text-emerald-500",
    decrease: "text-red-500",
    neutral: "text-gray-500"
};

const borderColors = {
    increase: "border-l-emerald-500",
    decrease: "border-l-amber-500",
    neutral: "border-l-gray-300"
}

const chartColors = {
    increase: "var(--color-emerald)",
    decrease: "var(--color-amber)",
    neutral: "var(--color-gray)"
}

export function KpiGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => (
        <KPICard key={index} className={cn("shadow-none border-l-4", borderColors[kpi.change])}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{kpi.name}</p>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">Target: {kpi.target}</p>
                </div>
                <div className={cn("p-1 rounded-md", changeColors[kpi.change])}>
                    {changeIcons[kpi.change]}
                </div>
            </div>
            <div className="h-10 -mx-6 -mb-6 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={kpi.chartData}>
                        <defs>
                            <linearGradient id={`color-${kpi.change}-${index}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={chartColors[kpi.change]} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={chartColors[kpi.change]} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <Tooltip
                            contentStyle={{display: 'none'}}
                            cursor={{stroke: chartColors[kpi.change], strokeWidth: 1, strokeDasharray: '3 3'}}
                        />
                        <Area type="monotone" dataKey="v" stroke={chartColors[kpi.change]} strokeWidth={2} fillOpacity={1} fill={`url(#color-${kpi.change}-${index})`} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </KPICard>
      ))}
    </div>
  );
}
