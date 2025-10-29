
'use client';
import { KPICard } from '@/components/kpi-card';
import { KPIMetric } from '@/lib/types';

export const KpiGrid = ({ kpiMetrics, kpiLoading, kpiError }: { kpiMetrics: KPIMetric[], kpiLoading: boolean, kpiError: string | null }) => {
  if (kpiLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-4 bg-white rounded-lg shadow-sm h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  if (kpiError || kpiMetrics.length === 0) {
    return (
      <div className="col-span-full bg-gray-50 text-gray-500 p-4 rounded-lg text-center h-32 flex items-center justify-center">
        <p>No Data to Show</p>
        {kpiError && <p className="text-sm text-red-500">{kpiError}</p>}
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiMetrics.map((metric) => (
        <KPICard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
