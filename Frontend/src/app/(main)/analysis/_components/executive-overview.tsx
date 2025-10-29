
'use client';

import { KPICard } from '@/components/kpi-card';
import { KPIMetric } from '@/lib/types';

interface ExecutiveOverviewProps {
  metrics: KPIMetric[];
  loading: boolean;
  error: string | null;
}

export function ExecutiveOverview({ metrics, loading, error }: ExecutiveOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow-sm h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || metrics.length === 0) {
    return (
      <div className="col-span-full bg-gray-50 text-gray-500 p-4 rounded-lg text-center mb-8">
        <p>No Data to Show</p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric) => (
        <KPICard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
