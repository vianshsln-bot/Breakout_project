
'use client';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ChartCard } from '@/components/analytics/ChartCard';
import { useState, useEffect } from 'react';

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
};

interface ApiChart {
    title: string;
    x_axis: (string | number)[];
    y_axis: (string | number)[];
    chart_type: keyof typeof chartComponents;
}

const movedChartsConfig = [
  { id: 'revenue-summary', title: 'Revenue vs Refunds', chartType: 'dual-bar', endpoint: 'revenue-summary' },
  { id: 'payments-status', title: 'Payments Status Breakdown', chartType: 'donut', endpoint: 'payments-status' },
  { id: 'lead-funnel', title: 'Lead Conversion Funnel', chartType: 'horizontal-bar', endpoint: 'lead-funnel' },
];

export const AdditionalAnalytics = () => {
  const { data, loading, error } = useAnalyticsData(movedChartsConfig);

  const [apiCharts, setApiCharts] = useState<ApiChart[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharts = async () => {
      setApiLoading(true);
      setApiError(null);
      try {
        const response = await fetch('https://breakout-project.onrender.com/kpis/charts');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch charts: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        setApiCharts(data.charts || []);
      } catch (err) {
        setApiError(err instanceof Error ? err.message : 'Failed to load charts.');
      } finally {
        setApiLoading(false);
      }
    };
    fetchCharts();
  }, []);

  const transformData = (chart: ApiChart) => {
    return chart.x_axis.map((x, index) => ({
      name: x,
      value: chart.y_axis[index],
    }));
  };

  const allChartsLoading = Object.values(loading).some(Boolean) || apiLoading;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Additional Analytics</h2>
      
      {(error['lead-funnel'] || apiError) && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center mb-6">
            <p>Failed to load some charts.</p>
            {error['lead-funnel'] && <p className="text-sm">{error['lead-funnel']}</p>}
            {apiError && <p className="text-sm">{apiError}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {movedChartsConfig.map((chart) => (
          <ChartCard
            key={chart.id}
            title={chart.title}
            chartType={chart.chartType as keyof typeof chartComponents}
            data={data[chart.id] || []}
            isLoading={loading[chart.id]}
            error={!loading[chart.id] ? error[chart.id] : undefined} // Don't show individual error if we have a general one
          />
        ))}

        {apiCharts.map((chart) => (
          <ChartCard
            key={chart.title}
            title={chart.title}
            chartType={chart.chart_type}
            data={transformData(chart)}
            isLoading={apiLoading}
          />
        ))}

        {allChartsLoading && movedChartsConfig.map((chart) => (
            !data[chart.id] && loading[chart.id] && <div key={`pulse-${chart.id}`} className="p-6 bg-gray-100 rounded-xl shadow-md h-72 animate-pulse" />
        ))}
         {apiLoading && apiCharts.length === 0 && Array.from({ length: 3 }).map((_, index) => (
            <div key={`pulse-api-${index}`} className="p-6 bg-gray-100 rounded-xl shadow-md h-72 animate-pulse" />
        ))}
      </div>
    </div>
  );
};
