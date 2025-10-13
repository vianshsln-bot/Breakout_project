'use client';

import { Target } from 'lucide-react';

export function QualityAssurance() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Target className="w-6 h-6 text-emerald-600" />
        <h2 className="text-2xl font-bold text-gray-900">Quality Assurance Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-white p-6 rounded-lg border border-emerald-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Overall Quality Score</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="10"
                  strokeDasharray="282.6"
                  strokeDashoffset={282.6 * (1 - 0.89)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-4xl font-bold text-gray-900">89</p>
                <p className="text-sm text-gray-500">Excellent</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Agent CSAT</span><span className="font-semibold">4.6/5</span></div>
            <div className="flex justify-between text-sm"><span>FCR Rate</span><span className="font-semibold">92%</span></div>
            <div className="flex justify-between text-sm"><span>Compliance Adherence</span><span className="font-semibold">98%</span></div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Coaching Recommendations</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white rounded-lg border"><span>Improve handling of pricing objections for <strong>Agent 007</strong>.</span></div>
            <div className="p-3 bg-white rounded-lg border"><span>Reduce silence time during technical support for <strong>Agent 004</strong>.</span></div>
            <div className="p-3 bg-white rounded-lg border"><span>Practice empathy statements for upselling with <strong>Agent 009</strong>.</span></div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quality Trend (30 Days)</h3>
          <div className="h-48 flex items-end justify-between gap-1">
            {[...Array(30)].map((_, i) => {
              const h = Math.random() * 80 + 20;
              return <div key={i} className="w-full bg-emerald-300 rounded-t hover:bg-emerald-500" style={{ height: `${h}%` }} />;
            })}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500">
            <span>30 days ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
