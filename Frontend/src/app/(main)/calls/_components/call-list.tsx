
'use client';
import { ApiCall as Call } from '@/lib/types';

interface CallListProps {
  calls: Call[];
  selectedCall: Call | null;
  onSelectCall: (call: Call) => void;
  loading: boolean;
  error: string | null;
}

export function CallList({ calls, selectedCall, onSelectCall, loading, error }: CallListProps) {
  if (loading && calls.length === 0) { // Only show skeleton on initial load
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 border-2 border-gray-200 rounded-lg h-28 animate-pulse bg-gray-50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-center">
          <p>Failed to load call data.</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {calls.map((call) => (
        <div
          key={call.conv_id}
          onClick={() => onSelectCall(call)}
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedCall?.conv_id === call.conv_id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="font-semibold text-gray-900">Conversation: {call.conv_id}</p>
              <p className="text-sm text-gray-600">
                Customer ID: {call.customer_id}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 mt-1">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p>
            </div>
          </div>
          <div className="flex gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
              {call.call_intent}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>{new Date(call.date_time).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
