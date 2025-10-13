'use client';

import { AlertCircle } from 'lucide-react';

export function Alerts() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-6 h-6 text-red-600" />
        <h3 className="text-2xl font-bold text-gray-900">Alerts</h3>
      </div>
      <ul className="space-y-2 text-sm">
        <li className="p-3 bg-red-50 rounded">Abandonment rate rising between 14:00-16:00 — investigate staffing.</li>
        <li className="p-3 bg-amber-50 rounded">Payment gateway failures increased by 2% in last 24h.</li>
        <li className="p-3 bg-blue-50 rounded">High positive sentiment detected on calls related to new "Summer" theme.</li>
      </ul>
    </div>
  );
}
