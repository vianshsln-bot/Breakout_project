
'use client';
import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { Booking } from '@/lib/types';
import { recentBookings as staticRecentBookings } from '@/lib/data';
import { API_BASE_URL } from '@/lib/config';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/?skip=0&limit=100`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Booking[] = await response.json();
        setBookings(data);
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

    fetchBookings();
  }, []);

  const totalBookings = bookings.length > 0 ? bookings.length : staticRecentBookings.length;
  const confirmedBookings = bookings.length > 0 
    ? bookings.filter(b => b.booking_status === 'confirmed').length
    : staticRecentBookings.filter(b => b.status === 'confirmed').length;
  
  // Using static data for revenue and avg value as it's not in the API response
  const totalRevenue = staticRecentBookings.reduce((sum, b) => sum + (b.value || 0), 0);
  const avgBookingValue = staticRecentBookings.length > 0 ? totalRevenue / staticRecentBookings.length : 0;

  const paymentMethods = {
    credit: staticRecentBookings.filter(b => b.paymentMethod === 'credit').length,
    debit: staticRecentBookings.filter(b => b.paymentMethod === 'debit').length,
    wallet: staticRecentBookings.filter(b => b.paymentMethod === 'wallet').length,
    bank: staticRecentBookings.filter(b => b.paymentMethod === 'bank').length
  };

  const renderBookingsTable = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-center">
            <p>Failed to load booking data.</p>
            <p className="text-sm">{error}</p>
          </div>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slot ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversation ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <tr key={booking.booking_id} className="hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{booking.booking_id}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.customer_id}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.slot_id}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.payment_id}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.conv_id}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(booking.booking_date).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{booking.guest_count}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    booking.booking_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                    booking.booking_status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    booking.booking_status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {booking.booking_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
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
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Bookings</p>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalBookings}</p>
          <div className="mt-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <p className="text-xs text-emerald-600">+22.5% conversion</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Confirmed</p>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{confirmedBookings}</p>
          <p className="text-xs text-gray-500 mt-2">{totalBookings > 0 ? ((confirmedBookings / totalBookings) * 100).toFixed(1) : '0.0'}% completion rate</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <IndianRupee className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Last 30 days (mock)</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Booking Value</p>
            <IndianRupee className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">₹{Math.round(avgBookingValue).toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-2">+15% vs target (mock)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings</h2>
          {renderBookingsTable()}
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

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Avg Processing Time</p>
                <p className="text-2xl font-bold text-gray-900">28s</p>
                <p className="text-xs text-blue-600 mt-1">-12% improvement</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-3">Payment Methods</p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Credit Card</span>
                      <span className="font-medium text-gray-900">{paymentMethods.credit} ({((paymentMethods.credit / staticRecentBookings.length) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(paymentMethods.credit / staticRecentBookings.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Debit Card</span>
                      <span className="font-medium text-gray-900">{paymentMethods.debit} ({((paymentMethods.debit / staticRecentBookings.length) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(paymentMethods.debit / staticRecentBookings.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Wallet</span>
                      <span className="font-medium text-gray-900">{paymentMethods.wallet} ({((paymentMethods.wallet / staticRecentBookings.length) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${(paymentMethods.wallet / staticRecentBookings.length) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Bank Transfer</span>
                      <span className="font-medium text-gray-900">{paymentMethods.bank} ({((paymentMethods.bank / staticRecentBookings.length) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(paymentMethods.bank / staticRecentBookings.length) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Metrics (mock)</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Modification Rate</span>
                <span className="font-bold text-gray-900">18.3%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">Cancellation Rate</span>
                <span className="font-bold text-gray-900">12.8%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">No-Show Rate</span>
                <span className="font-bold text-gray-900">7.2%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded">
                <span className="text-sm text-gray-600">Rebooking Rate</span>
                <span className="font-bold text-emerald-600">34%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
