
'use client';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ChartCard } from './analytics/ChartCard';
import { useDashboardFilter } from '@/context/DashboardFilterContext';

const chartComponents = {
  line: "line",
  bar: "bar",
  'bar-line': "bar-line",
  funnel: "funnel",
  pie: "pie",
  area: "area",
  'horizontal-bar': "horizontal-bar",
  'dual-bar': "dual-bar",
  donut: "donut",
  'call-sentiment': "call-sentiment",
  bubble: "bubble",
  treemap: "treemap",
};

export const AnalyticsOverview = () => {
  const { dateRange } = useDashboardFilter();
  const { data, loading, error, chartsConfig, isRetrying } = useAnalyticsData(undefined, dateRange);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Analytics Overview</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chartsConfig.map((chart) => (
          <ChartCard
            key={chart.id}
            title={chart.title}
            chartType={chart.chartType as keyof typeof chartComponents}
            data={data[chart.id] || []}
            isLoading={loading[chart.id]}
            error={error[chart.id]}
            isRetrying={isRetrying[chart.id]}
          />
        ))}
      </div>
    </div>
  );
};
