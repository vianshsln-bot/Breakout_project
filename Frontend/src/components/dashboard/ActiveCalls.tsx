
'use client';
import { Phone } from 'lucide-react';
import { ApiCall as Call } from '@/lib/types';

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ActiveCalls = ({ activeCalls, callsLoading, callsError }: { activeCalls: Call[], callsLoading: boolean, callsError: string | null }) => {
  const renderActiveCalls = () => {
    if (callsLoading) {
      return (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg h-24 animate-pulse" />
          ))}
        </div>
      );
    }

    if (callsError || activeCalls.length === 0) {
      return (
        <div className="max-h-96 h-60 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-gray-500 text-center">
            <p>No Data to Show</p>
             {callsError && <p className="text-sm text-red-500">{callsError}</p>}
          </div>
        </div>
      );
    }

    return (
       <div className="space-y-3 max-h-96 overflow-y-auto">
        {activeCalls.map((call) => (
          <div key={call.conv_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className={`px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800`}>
                  {call.call_intent}
                </div>
                <p className="font-semibold text-gray-900">Conv: {call.conv_id}</p>
              </div>
              <p className="text-sm text-gray-600 mt-1">Customer: {call.customer_id}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatDuration(call.duration)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Phone className="w-6 h-6 text-blue-600" />
          Active Calls
        </h2>
      </div>
      {renderActiveCalls()}
    </div>
  );
};
