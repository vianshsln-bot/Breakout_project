'use client';

import { KPICard } from '@/components/kpi-card';
import { KPIMetric } from '@/lib/types';

interface KpiSectionProps {
  title: string;
  kpiIds: string[];
  metrics: KPIMetric[];
  loading: boolean;
}

export function KpiSection({ title, kpiIds, metrics, loading }: KpiSectionProps) {
  const items = metrics.filter((m: KPIMetric) => kpiIds.includes(m.id));

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      {items.length === 0 && !loading ? (
        <div className="text-sm text-gray-500">No KPIs available for this category.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg h-24 animate-pulse" />
          )) : items.map((metric: KPIMetric) => (
            <KPICard key={metric.id} metric={metric} />
          ))}
        </div>
      )}
    </div>
  );
}
