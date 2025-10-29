
'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ArrowUp, ArrowDown } from 'lucide-react';
import { ApiCall as Call } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { CallList } from './_components/call-list';
import { CallDetails } from './_components/call-details';

const ITEMS_PER_PAGE = 10;
type SortDirection = 'ascending' | 'descending';

export default function CallsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [allCalls, setAllCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [intentFilter, setIntentFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Call; direction: SortDirection } | null>({ key: 'date_time', direction: 'descending' });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const fetchAllCalls = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/calls/`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText || response.statusText}`);
      }
      const data: Call[] = await response.json();
      setAllCalls(data);

      if (data.length > 0) {
        // Set selected call to the first one after initial sort
        const sortedData = [...data].sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime());
        setSelectedCall(sortedData[0]);
      }
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
    fetchAllCalls();
  }, []);

  const uniqueIntents = useMemo(() => {
    const intents = new Set(allCalls.map(c => c.call_intent));
    return ['all', ...Array.from(intents)];
  }, [allCalls]);

  const requestSort = (key: keyof Call) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedCalls = useMemo(() => {
    let filtered = allCalls.filter(c =>
        (c.conv_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(c.customer_id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.call_intent.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (intentFilter === 'all' || c.call_intent === intentFilter)
    );

    if (timeFilter !== 'all') {
        const now = new Date();
        filtered = filtered.filter(c => {
            const callDate = new Date(c.date_time);
            if (timeFilter === 'today') {
                return callDate.toDateString() === now.toDateString();
            }
            const daysAgo = {
                '7d': 7,
                '30d': 30,
            }[timeFilter];

            if(daysAgo) {
                const filterDate = new Date();
                filterDate.setDate(now.getDate() - daysAgo);
                return callDate >= filterDate;
            }
            return true;
        });
    }

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [allCalls, searchTerm, intentFilter, timeFilter, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
    if(filteredAndSortedCalls.length > 0 && !selectedCall) {
        setSelectedCall(filteredAndSortedCalls[0])
    }
  }, [searchTerm, intentFilter, timeFilter]);
  
  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedCalls.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedCalls, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedCalls.length / ITEMS_PER_PAGE);


  const getSortIcon = (key: keyof Call) => {
    if (!sortConfig || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-500 mt-1">Comprehensive call analysis and insights</p>
        </div>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900">{allCalls.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Duration</p>
          <p className="text-3xl font-bold text-gray-900">
            {allCalls.length > 0 ? `${(allCalls.reduce((sum, c) => sum + c.duration, 0) / allCalls.length / 60).toFixed(1)} min` : 'N/A'}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Total Credits Consumed</p>
          <p className="text-3xl font-bold text-gray-900">
            {allCalls.reduce((sum, c) => sum + c.credits_consumed, 0).toFixed(2)}
          </p>
        </div>
         <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Unique Customers</p>
          <p className="text-3xl font-bold text-gray-900">
            {new Set(allCalls.map(c => c.customer_id)).size}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-6 flex flex-col">
          <div className="flex flex-col gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-sm font-medium text-gray-700">Intent</label>
                  <select value={intentFilter} onChange={e => setIntentFilter(e.target.value)} className="w-full mt-1 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {uniqueIntents.map(intent => <option key={intent} value={intent}>{intent === 'all' ? 'All Intents' : intent}</option>)}
                  </select>
              </div>
               <div>
                  <label className="text-sm font-medium text-gray-700">Time</label>
                  <select value={timeFilter} onChange={e => setTimeFilter(e.target.value)} className="w-full mt-1 pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                  </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 text-sm">
                <span className="text-gray-600">Sort by:</span>
                <button onClick={() => requestSort('date_time')} className="flex items-center font-medium">Date {getSortIcon('date_time')}</button>
                <button onClick={() => requestSort('duration')} className="flex items-center font-medium">Duration {getSortIcon('duration')}</button>
                <button onClick={() => requestSort('call_intent')} className="flex items-center font-medium">Intent {getSortIcon('call_intent')}</button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            <CallList 
              calls={paginatedCalls}
              selectedCall={selectedCall}
              onSelectCall={setSelectedCall}
              loading={loading && allCalls.length === 0}
              error={error}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
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
