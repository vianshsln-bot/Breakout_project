
'use client';
import { useState, useEffect, useMemo } from 'react';
import { IndianRupee, TrendingUp, Calendar, CreditCard, ArrowUp, ArrowDown } from 'lucide-react';
import { Booking } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

type SortDirection = 'ascending' | 'descending';
const ITEMS_PER_PAGE = 10;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtering states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();

  // Sorting state
  const [sortConfig, setSortConfig] = useState<{ key: keyof Booking; direction: SortDirection } | null>({ key: 'start_time', direction: 'descending' });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/`);
        if (!response.ok) {
           const errorText = await response.text();
           throw new Error(`HTTP error! Status: ${response.status} - ${errorText || response.statusText}`);
        }
        const data: Booking[] = await response.json();
        setBookings(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred while fetching bookings.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const uniqueStatuses = useMemo(() => ['all', ...Array.from(new Set(bookings.map(b => b.status)))], [bookings]);

  const requestSort = (key: keyof Booking) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const filteredAndSortedBookings = useMemo(() => {
    let filtered = bookings.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }
      const bookingDate = new Date(b.start_time);
      const now = new Date();

      if(dateFilter === 'today') {
        return bookingDate.toDateString() === now.toDateString();
      }
      if(dateFilter === '7d') {
        return bookingDate >= subDays(now, 7) && bookingDate <= now;
      }
      if(dateFilter === '30d') {
        return bookingDate >= subDays(now, 30) && bookingDate <= now;
      }
      if(dateFilter === 'custom' && customDateRange?.from && customDateRange?.to) {
        return bookingDate >= customDateRange.from && bookingDate <= customDateRange.to;
      }
      return true; // 'all'
    });

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

  }, [bookings, statusFilter, dateFilter, customDateRange, sortConfig]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, dateFilter, customDateRange]);

  const paginatedBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredAndSortedBookings, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedBookings.length / ITEMS_PER_PAGE);

  const totalBookings = filteredAndSortedBookings.length;
  const confirmedBookings = filteredAndSortedBookings.filter(b => b.status === 'confirmed' || b.status === 'active').length;
  
  const getSortIcon = (key: keyof Booking) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  const SortableHeader = ({ sortKey, children }: { sortKey: keyof Booking, children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer" onClick={() => requestSort(sortKey)}>
      <div className="flex items-center">
        {children}
        {getSortIcon(sortKey)}
      </div>
    </th>
  );

  const renderBookingsTable = () => {
    if (loading && bookings.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error && bookings.length === 0) {
      return (
        <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg">
          <div className="text-red-600 text-center">
            <p className="font-bold">Failed to load booking data.</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      );
    }

    if (filteredAndSortedBookings.length === 0) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-500">
                <p>No bookings found matching your criteria.</p>
            </div>
        );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event ID</th>
              <SortableHeader sortKey="start_time">Start Time</SortableHeader>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversation ID</th>
              <SortableHeader sortKey="status">Status</SortableHeader>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedBookings.map((booking) => (
              <tr key={booking.booking_id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{booking.booking_id.slice(-8)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.customer_id.slice(-8)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.event_id.slice(-12)}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(booking.start_time).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.conv_id || 'N/A'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                    booking.status === 'confirmed' || booking.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                    booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    return (
        <div className="flex justify-between items-center mt-4">
            <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Previous</Button>
            <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
            <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</Button>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-500 mt-1">Track bookings, payments, and analytics</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + New Booking
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Total Bookings (Filtered)</p>
          <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Confirmed/Active (Filtered)</p>
          <p className="text-3xl font-bold text-gray-900">{confirmedBookings}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Recent Bookings</h2>
              <div className="flex flex-wrap gap-4">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      {uniqueStatuses.map(s => <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s}</option>)}
                  </select>
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="7d">Last 7 Days</option>
                      <option value="30d">Last 30 Days</option>
                      <option value="custom">Custom Range</option>
                  </select>
                  {dateFilter === 'custom' && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="date"
                                variant={"outline"}
                                className="w-[240px] justify-start text-left font-normal"
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customDateRange?.from ? (
                                    customDateRange.to ? (
                                        `${format(customDateRange.from, 'LLL dd, y')} - ${format(customDateRange.to, 'LLL dd, y')}`
                                    ) : (
                                        format(customDateRange.from, 'LLL dd, y')
                                    )
                                 ) : (
                                    <span>Pick a date range</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarPicker
                                initialFocus
                                mode="range"
                                defaultMonth={customDateRange?.from}
                                selected={customDateRange}
                                onSelect={setCustomDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                  )}
              </div>
          </div>
          {renderBookingsTable()}
          {renderPagination()}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Analytics (mock)
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Payment Success Rate</p>
                <p className="text-3xl font-bold text-emerald-600">97.8%</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '97.8%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Metrics (mock)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Cancellation Rate</span>
                <span className="font-bold text-gray-900">{bookings.length > 0 ? ((bookings.filter(b => b.status === 'cancelled').length / bookings.length) * 100).toFixed(1) : '0.0'}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
