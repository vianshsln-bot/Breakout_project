
'use client';

import { useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

interface AiMetric {
  name: string;
  value: number;
  description: string;
  output_format: string;
}

export function AiPerformance() {
  const [metrics, setMetrics] = useState<AiMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAiKpis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://breakout-project.onrender.com/kpis/llmkpi');
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch AI KPIs: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        setMetrics(data.llmkpi || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load AI KPIs.');
      } finally {
        setLoading(false);
      }
    };
    fetchAiKpis();
  }, []);

  const renderKpiCards = () => {
    if (loading && metrics.length === 0) {
      return Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-100 h-24 animate-pulse" />
      ));
    }
    
    if (error && metrics.length === 0) {
        return (
            <div className="col-span-full bg-red-50 text-red-700 p-4 rounded-lg text-center">
                <p>Failed to load AI KPI data.</p>
                <p className="text-sm">{error}</p>
            </div>
        )
    }

    return metrics.map((metric) => (
      <div key={metric.name} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
        <p className="text-sm text-gray-600 mb-2">{metric.name}</p>
        <p className="text-2xl font-bold text-gray-900">{metric.value.toFixed(2)}%</p>
      </div>
    ));
  };


  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {renderKpiCards()}
      </div>
      {/*
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Intent Recognition Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2">Predicted</th>
                  <th className="p-2 text-center">Booking</th>
                  <th className="p-2 text-center">Pricing</th>
                  <th className="p-2 text-center">Support</th>
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2 font-semibold bg-gray-100">{row[0]}</td>
                    {row.slice(1).map((val, j) => (
                      <td key={j} className={`p-2 text-center ${(i === j) ? 'bg-emerald-50 font-bold' : 'bg-white'}`}>
                        {(Number(val) * 100).toFixed(0)}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Conversation Completion Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Completed by AI</span>
                <span className="text-sm font-medium">76%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '76%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Transferred to Human</span>
                <span className="text-sm font-medium">18%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: '18%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Abandoned by User</span>
                <span className="text-sm font-medium">6%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-red-600 h-2.5 rounded-full" style={{ width: '6%' }}></div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-sm text-blue-800">Insight</h4>
            <p className="text-xs text-blue-700 mt-1">
              The 18% transfer rate is mainly driven by complex, multi-part queries that the AI is not yet trained to handle.
              Consider creating a new intent for "Group Booking Inquiry".
            </p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
