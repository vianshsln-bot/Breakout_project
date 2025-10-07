'use client';

import { sentimentDistributionData } from "@/lib/data";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip } from 'recharts';

export function SentimentDistributionChart() {
    return (
        <ResponsiveContainer width="100%" height={150}>
            <PieChart>
                <Pie data={sentimentDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    {sentimentDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
                <Legend iconSize={10} wrapperStyle={{fontSize: '12px'}}/>
            </PieChart>
        </ResponsiveContainer>
    );
}
