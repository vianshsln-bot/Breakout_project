'use client';

import { Brain } from 'lucide-react';

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

export function AiPerformance() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900">AI Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {aiMetrics.map((metric) => (
          <div key={metric.label} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm text-gray-600 mb-2">{metric.label}</p>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>
        ))}
      </div>

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
    </div>
  );
}
