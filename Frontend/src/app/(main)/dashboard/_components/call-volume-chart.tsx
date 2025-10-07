'use client';

import { callVolumeData } from "@/lib/data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function CallVolumeChart() {
    return (
        <ResponsiveContainer width="100%" height={150}>
            <BarChart data={callVolumeData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip cursor={{fill: 'hsl(var(--accent) / 0.2)'}} contentStyle={{backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}}/>
            <Bar dataKey="calls" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
