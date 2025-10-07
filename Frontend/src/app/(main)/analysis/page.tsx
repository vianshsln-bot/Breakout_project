
'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Brain, Target, TrendingUp, AlertCircle } from 'lucide-react';
import { KPIMetric, KpiApiResponse } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

const formatDurationFromSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} min`;
};

export default function AnalysisPage() {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const aiMetrics = [
    { label: 'Intent Recognition Accuracy', value: '94.2%', target: '85-90%', status: 'good' },
    { label: 'Conversation Completion Rate', value: '76.4%', target: '60-70%', status: 'good' },
    { label: 'Human Handoff Accuracy', value: '96.7%', target: '85-90%', status: 'good' },
    { label: 'AI Deflection Rate', value: '58.3%', target: '40-60%', status: 'good' },
    { label: 'Overall Quality Score', value: '89.7%', target: '80-85%', status: 'good' }
  ];

  const confusionMatrix = [
    ['Booking', 0.92, 0.05, 0.03],
    ['Pricing', 0.04, 0.94, 0.02],
    ['Support', 0.03, 0.02, 0.95]
  ];

  useEffect(() => {
    const fetchKpis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/compute/kpis`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: KpiApiResponse = await response.json();
        const kpis = data.kpis;

        const kpiConfig: { id: keyof typeof kpis; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' }[] = [
            { id: 'first_call_resolution_pct', label: 'First Call Resolution', target: '>90%', higherIsBetter: true, unit: 'percentage' },
            { id: 'avg_call_duration_sec', label: 'Avg Call Duration', target: '<5 min', higherIsBetter: false, unit: 'seconds' },
            { id: 'call_abandon_rate_pct', label: 'Call Abandon Rate', target: '<5%', higherIsBetter: false, unit: 'percentage' },
            { id: 'customer_satisfaction_avg_rating', label: 'Customer Satisfaction', target: '>4.5', higherIsBetter: true, unit: 'rating' },
            { id: 'missed_calls', label: 'Missed Calls', target: '0', higherIsBetter: false, unit: 'number' },
            { id: 'customer_conversion_rate_pct', label: 'Customer Conversion Rate', target: '>10%', higherIsBetter: true, unit: 'percentage' },
            { id: 'overall_quality_score', label: 'Overall Quality Score', target: '>85', higherIsBetter: true, unit: 'number' },
            { id: 'positive_sentiment_rate_pct', label: 'Positive Sentiment Rate', target: '>80%', higherIsBetter: true, unit: 'percentage' },
        ];
        
        const mappedKpis: KPIMetric[] = kpiConfig.map(config => {
            const value = kpis[config.id];
            let displayValue: string;
            let status: 'good' | 'warning' | 'critical';

            const targetValue = parseFloat(config.target.replace(/[^\d.-]/g, ''));

            switch (config.unit) {
                case 'percentage':
                    displayValue = `${value.toFixed(1)}%`;
                    status = config.higherIsBetter 
                        ? (value >= targetValue ? 'good' : 'warning') 
                        : (value <= targetValue ? 'good' : 'warning');
                    break;
                case 'seconds':
                    displayValue = formatDurationFromSeconds(value);
                     status = config.higherIsBetter 
                        ? (value >= targetValue * 60 ? 'good' : 'warning') 
                        : (value <= targetValue * 60 ? 'good' : 'warning');
                    break;
                case 'rating':
                    displayValue = `${value.toFixed(1)}/5`;
                    status = value >= targetValue ? 'good' : 'warning';
                    break;
                default: // number
                    displayValue = value.toString();
                     status = config.higherIsBetter
                      ? (value >= targetValue ? 'good' : 'warning')
                      : (value <= targetValue ? 'good' : 'warning');
                    if (config.id === 'missed_calls' && value > 0) status = 'critical';
            }
            
            // Helper function to generate plausible sparkline data
            const generateSparklineData = (currentValue: number, points: number = 8) => {
              const data = [currentValue];
              for (let i = 1; i < points; i++) {
                const fluctuation = (Math.random() - 0.5) * (currentValue * 0.2); // Fluctuate by up to 20%
                const previousValue = data[0];
                const newValue = Math.max(0, previousValue + fluctuation);
                data.unshift(newValue);
              }
              return data;
            };

            // Helper function to determine the trend
            const getTrend = (sparklineData: number[]): 'up' | 'down' | 'stable' => {
              if (sparklineData.length < 2) return 'stable';
              const last = sparklineData[sparklineData.length - 1];
              const secondLast = sparklineData[sparklineData.length - 2];
              if (last > secondLast) return 'up';
              if (last < secondLast) return 'down';
              return 'stable';
            };
            
            const sparklineData = generateSparklineData(value);
            const trend = getTrend(sparklineData);


            return {
                id: config.id,
                label: config.label,
                value: displayValue,
                target: config.target,
                trend: trend,
                status: status,
                sparklineData: sparklineData,
            };
        });

        setKpiMetrics(mappedKpis);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchKpis();
  }, []);

  const renderExecutiveOverview = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      );
    }

    if (error) {
       return (
        <div className="col-span-full bg-red-50 text-red-700 p-4 rounded-lg text-center mb-8">
          <p>Failed to load KPI data.</p>
          <p className="text-sm">{error}</p>
        </div>
      );
    }

    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpiMetrics.map((metric) => (
            <div key={metric.id} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">Target: {metric.target}</p>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  metric.status === 'good' ? 'bg-emerald-100 text-emerald-800' :
                  metric.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {metric.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
    );
  };


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Hub</h1>
        <p className="text-gray-500 mt-1">Deep dive analytics and AI performance metrics</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Executive Overview</h2>
        </div>

        {renderExecutiveOverview()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-lg border border-blue-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Heatmap
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {kpiMetrics.map((metric) => (
                <div
                  key={metric.id}
                  className={`p-3 rounded text-center ${
                    metric.status === 'good' ? 'bg-emerald-500' :
                    metric.status === 'warning' ? 'bg-amber-500' :
                    'bg-red-500'
                  } bg-opacity-20 hover:bg-opacity-30 transition-all cursor-pointer`}
                >
                  <p className="text-xs font-medium text-gray-700">{metric.label.split(' ').slice(0,2).join(' ')}</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">{metric.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-lg border border-purple-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-600" />
              AI-Generated Insights
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Peak Performance</p>
                  <p className="text-xs text-gray-600">First Call Resolution up 6% this month. AI agents showing strong improvement in complex queries.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Attention Needed</p>
                  <p className="text-xs text-gray-600">Abandonment rate trending up during 2-4pm. Consider staffing adjustments.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Opportunity</p>
                  <p className="text-xs text-gray-600">High conversion rate on Premium packages. Recommend training agents to upsell.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">AI Performance Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {aiMetrics.map((metric) => (
            <div key={metric.label} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-purple-900">{metric.value}</p>
              <p className="text-xs text-gray-500 mt-2">Target: {metric.target}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Intent Recognition Matrix</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2 text-sm font-medium text-gray-600">Actual / Predicted</th>
                    <th className="p-2 text-sm font-medium text-gray-600">Booking</th>
                    <th className="p-2 text-sm font-medium text-gray-600">Pricing</th>
                    <th className="p-2 text-sm font-medium text-gray-600">Support</th>
                  </tr>
                </thead>
                <tbody>
                  {confusionMatrix.map(([label, ...values]) => (
                    <tr key={label as string}>
                      <td className="p-2 text-sm font-medium text-gray-900">{label}</td>
                      {(values as number[]).map((val, i) => (
                        <td key={i} className="p-2">
                          <div
                            className={`text-center py-2 rounded font-bold ${
                              val > 0.9 ? 'bg-emerald-500 text-white' :
                              val > 0.7 ? 'bg-emerald-300 text-emerald-900' :
                              'bg-amber-200 text-amber-900'
                            }`}
                          >
                            {(val * 100).toFixed(0)}%
                          </div>
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
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Successfully Completed</span>
                  <span className="font-bold text-gray-900">76.4%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '76.4%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Escalated to Human</span>
                  <span className="font-bold text-gray-900">18.2%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: '18.2%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Abandoned</span>
                  <span className="font-bold text-gray-900">5.4%</span>
                </div>
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500" style={{ width: '5.4%' }} />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-semibold text-blue-900 mb-2">Top Failure Reasons</p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Complex pricing inquiries (34%)</li>
                <li>• Custom package requests (28%)</li>
                <li>• Payment disputes (21%)</li>
                <li>• Technical issues (17%)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <Target className="w-6 h-6 text-emerald-600" />
          <h2 className="text-2xl font-bold text-gray-900">Quality Assurance Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-lg border border-emerald-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Quality Score</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                  <circle
                    cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="10"
                    strokeDasharray="251.2"
                    strokeDashoffset={251.2 * (1 - 0.897)}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-gray-900">89.7</p>
                  <p className="text-xs text-gray-500">out of 100</p>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Script Adherence</span>
                <span className="font-bold text-gray-900">92%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tone & Professionalism</span>
                <span className="font-bold text-gray-900">88%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Resolution Effectiveness</span>
                <span className="font-bold text-gray-900">91%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Coaching Recommendations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border border-gray-200">
                <p className="font-semibold text-sm text-gray-900">Active Listening</p>
                <p className="text-xs text-gray-600 mt-1">5 agents need training</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '60%' }} />
                </div>
              </div>
              <div className="p-3 bg-white rounded border border-gray-200">
                <p className="font-semibold text-sm text-gray-900">Upselling Techniques</p>
                <p className="text-xs text-gray-600 mt-1">8 agents need training</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '45%' }} />
                </div>
              </div>
              <div className="p-3 bg-white rounded border border-gray-200">
                <p className="font-semibold text-sm text-gray-900">Complaint Resolution</p>
                <p className="text-xs text-gray-600 mt-1">3 agents need training</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quality Trend (30 Days)</h3>
            <div className="h-48 flex items-end justify-between gap-1">
              {Array.from({ length: 30 }, (_, i) => {
                const height = 70 + Math.random() * 30;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-emerald-500 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Day 1</span>
              <span>Day 15</span>
              <span>Day 30</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
