
'use client';
import { useState, useEffect } from 'react';
import { Search, Filter } from 'lucide-react';
import { ApiCall as Call } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { CallList } from './_components/call-list';
import { CallDetails } from './_components/call-details';

const CALLS_PER_PAGE = 15;

export default function CallsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchMoreCalls = async (initialLoad = false) => {
    if (loading && !initialLoad) return;
    setLoading(true);
    
    try {
      const currentOffset = initialLoad ? 0 : offset;
      const response = await fetch(`${API_BASE_URL}/calls/?skip=${currentOffset}&limit=${CALLS_PER_PAGE}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
      
      const data: Call[] = await response.json();
      
      if (data.length < CALLS_PER_PAGE) {
        setHasMore(false);
      }
      
      setCalls(prevCalls => initialLoad ? data : [...prevCalls, ...data]);
      
      if (initialLoad && data.length > 0) {
        setSelectedCall(data[0]);
      }
      
      setOffset(currentOffset + CALLS_PER_PAGE);
      setError(null); // Clear error on successful fetch

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while fetching calls.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMoreCalls(true);
  }, []);

  const filteredCalls = calls.filter(c =>
    c.conv_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.call_intent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full">
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


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls..."
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

          <div className="flex-1 overflow-y-auto">
            <CallList 
              calls={filteredCalls}
              selectedCall={selectedCall}
              onSelectCall={setSelectedCall}
              loading={loading}
              error={error}
            />
          </div>

        </div>

        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <CallDetails selectedCall={selectedCall} />
        </div>
      </div>
    </div>
  );
}

    
