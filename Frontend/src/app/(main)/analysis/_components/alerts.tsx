
'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { KPIMetric } from '@/lib/types';

interface AlertProps {
  metrics: KPIMetric[];
  loading: boolean;
}

interface GeneratedAlert {
    message: string;
    type: 'critical' | 'warning' | 'info';
}

export function Alerts({ metrics, loading }: AlertProps) {

  const generateAlerts = (): GeneratedAlert[] => {
    if (!metrics || metrics.length === 0) {
      return [];
    }

    const generated: GeneratedAlert[] = [];

    metrics.forEach(metric => {
        if (metric.status === 'critical') {
            generated.push({ message: `${metric.label} is at a critical level (${metric.value}). Immediate attention required.`, type: 'critical' });
        } else if (metric.status === 'warning') {
            generated.push({ message: `${metric.label} is outside the target range (${metric.value}). Consider investigating.`, type: 'warning' });
        }
    });

    if (generated.length === 0) {
        generated.push({ message: 'All key performance indicators are within their target ranges.', type: 'info' });
    }

    return generated;
  }

  const alerts = generateAlerts();

  const getAlertStyles = (type: GeneratedAlert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-6 h-6 text-gray-700" />
        <h3 className="text-2xl font-bold text-gray-900">System Alerts</h3>
      </div>
      {loading ? (
         <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 bg-gray-100 rounded animate-pulse h-10" />
            ))}
        </div>
      ) : (
        <ul className="space-y-3 text-sm">
          {alerts.map((alert, index) => (
            <li key={index} className={`p-3 border rounded-lg flex items-start gap-3 ${getAlertStyles(alert.type)}`}>
                {alert.type === 'info' ? <CheckCircle className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                <span>{alert.message}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
