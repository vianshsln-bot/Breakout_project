'use client';
import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardFilter } from '@/context/DashboardFilterContext';

export const Header = () => {
  const [time, setTime] = useState('');
  const { setDateRange, dateRange } = useDashboardFilter();

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
        <p className="text-gray-500 mt-1">Real-time operational overview</p>
      </div>
      <div className="flex gap-3 items-center">
        <Select value={dateRange} onValueChange={(value) => setDateRange(value as any)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a date range" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="last_week">Last Week</SelectItem>
                <SelectItem value="last_month">Last Month</SelectItem>
                <SelectItem value="all_time">All Time</SelectItem>
            </SelectContent>
        </Select>
        <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-medium">
          System Online
        </div>
        <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg">
          {time}
        </div>
      </div>
    </div>
  );
};
