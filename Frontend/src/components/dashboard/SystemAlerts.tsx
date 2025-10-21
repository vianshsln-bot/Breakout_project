
'use client';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '@/lib/types';

export const SystemAlerts = ({ alerts, kpiLoading }: { alerts: Alert[], kpiLoading: boolean }) => {
  const renderAlerts = () => {
    if (kpiLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg h-20 animate-pulse bg-gray-50" />
          ))}
        </div>
      );
    }
    
    return (
        <div className="space-y-3">
            {alerts.map((alert) => (
                <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-500' :
                    'bg-blue-50 border-blue-500'
                }`}
                >
                <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                    {!alert.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                </div>
                <p className="text-xs text-gray-600">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
                </div>
            ))}
            </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-600" />
        System Alerts
      </h2>
      {renderAlerts()}
    </div>
  );
};
