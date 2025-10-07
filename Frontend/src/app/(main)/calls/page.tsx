
'use client';
import { useState, useEffect } from 'react';
import { Phone, Search, Filter, Play } from 'lucide-react';
import { ApiCall as Call } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';

export default function CallsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/calls/?skip=0&limit=100`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Call[] = await response.json();
        setCalls(data);
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

    fetchCalls();
  }, []);

  const filteredCalls = calls
    .filter(c =>
      c.conv_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.call_intent.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 50);

  const renderCallList = () => {
    if (loading) {
      return (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {Array.from({ length: 5 }).map((_, i) => (
             <div key={i} className="p-4 border-2 border-gray-200 rounded-lg h-28 animate-pulse bg-gray-50" />
          ))}
        </div>
      )
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
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {filteredCalls.map((call) => (
          <div
            key={call.conv_id}
            onClick={() => setSelectedCall(call)}
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
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-500 mt-1">Comprehensive call analysis and insights</p>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900">{calls.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Duration</p>
          <p className="text-3xl font-bold text-gray-900">
            {calls.length > 0 ? `${(calls.reduce((sum, c) => sum + c.duration, 0) / calls.length / 60).toFixed(1)} min` : 'N/A'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Total Credits Consumed</p>
          <p className="text-3xl font-bold text-gray-900">
            {calls.reduce((sum, c) => sum + c.credits_consumed, 0).toFixed(2)}
          </p>
        </div>
         <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Unique Customers</p>
          <p className="text-3xl font-bold text-gray-900">
            {new Set(calls.map(c => c.customer_id)).size}
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls by conversation or intent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {renderCallList()}

        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {selectedCall ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Call Details</h3>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Play className="w-4 h-4" />
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
                  <div className="p-3 bg-gray-50 rounded text-xs text-gray-700 max-h-40 overflow-y-auto">
                    {selectedCall.transcript}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Credits Consumed</p>
                  <p className="font-bold text-gray-900">{selectedCall.credits_consumed.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">Select a call to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
