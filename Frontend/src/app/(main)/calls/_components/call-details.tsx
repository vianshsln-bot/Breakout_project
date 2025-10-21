
'use client';
import { Play, Phone } from 'lucide-react';
import { ApiCall as Call } from '@/lib/types';

interface CallDetailsProps {
  selectedCall: Call | null;
}

export function CallDetails({ selectedCall }: CallDetailsProps) {
  if (!selectedCall) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <Phone className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500">Select a call to view details</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900">Call Details</h3>
        <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Play className="w-4 h-4 fill-white" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Customer ID</p>
          <p className="font-semibold text-gray-900">{selectedCall.customer_id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Conversation ID</p>
          <p className="font-semibold text-gray-900">{selectedCall.conv_id}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Intent</p>
          <p className="font-semibold text-gray-900">{selectedCall.call_intent}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Duration</p>
          <p className="font-semibold text-gray-900">
            {Math.floor(selectedCall.duration / 60)}m {selectedCall.duration % 60}s
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Transcript</p>
          <div className="p-3 bg-gray-50 rounded text-xs text-gray-700 max-h-40 overflow-y-auto border">
            {selectedCall.transcript}
          </div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Credits Consumed</p>
          <p className="font-bold text-gray-900">{selectedCall.credits_consumed.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
