
'use client';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { KPIMetric } from '../lib/types';

interface KPICardProps {
  metric: KPIMetric;
  onClick?: () => void;
}

export function KPICard({ metric, onClick }: KPICardProps) {
  const statusColors = {
    good: 'border-emerald-500 bg-emerald-50',
    warning: 'border-amber-500 bg-amber-50',
    critical: 'border-red-500 bg-red-50'
  };

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4" />,
    down: <TrendingDown className="w-4 h-4" />,
    stable: <Minus className="w-4 h-4" />
  };

  return (
    <div
      onClick={onClick}
      className={`p-4 border-l-4 ${statusColors[metric.status]} bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-gray-600">{metric.label}</h3>
        <span className={`${metric.trend === 'up' ? 'text-emerald-600' : metric.trend === 'down' ? 'text-blue-600' : 'text-gray-500'}`}>
          {trendIcons[metric.trend]}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
          <p className="text-xs text-gray-500 mt-1">Target: {metric.target}</p>
        </div>
        <div className="w-16 h-8">
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <polyline
              fill="none"
              stroke={metric.status === 'good' ? '#10b981' : metric.status === 'warning' ? '#f59e0b' : '#ef4444'}
              strokeWidth="2"
              points={metric.sparklineData
                .map((val, i) => `${(i / (metric.sparklineData.length - 1)) * 100},${30 - (val / Math.max(...metric.sparklineData)) * 25}`)
                .join(' ')}
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
