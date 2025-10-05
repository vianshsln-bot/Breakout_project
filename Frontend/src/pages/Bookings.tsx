import { DollarSign, TrendingUp, Calendar, CreditCard } from 'lucide-react';
import { recentBookings } from '../data/mockData';

export function Bookings() {
  const totalBookings = recentBookings.length;
  const confirmedBookings = recentBookings.filter(b => b.status === 'confirmed').length;
  const totalRevenue = recentBookings.reduce((sum, b) => sum + b.value, 0);
  const avgBookingValue = totalRevenue / totalBookings;

  const paymentMethods = {
    credit: recentBookings.filter(b => b.paymentMethod === 'credit').length,
    debit: recentBookings.filter(b => b.paymentMethod === 'debit').length,
    wallet: recentBookings.filter(b => b.paymentMethod === 'wallet').length,
    bank: recentBookings.filter(b => b.paymentMethod === 'bank').length
  };

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
          <p className="text-xs text-gray-500 mt-2">{((confirmedBookings / totalBookings) * 100).toFixed(1)}% completion rate</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Avg Booking Value</p>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">${Math.round(avgBookingValue).toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-2">+15% vs target</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Bookings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBookings.slice(0, 20).map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{booking.customerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{booking.eventType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(booking.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{booking.guestCount}</td>
                    <td className="px-4 py-3 text-sm font-bold text-emerald-600">
                      ${booking.value.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600 capitalize">{booking.paymentMethod}</span>
                        <span className={`text-xs font-medium ${
                          booking.paymentStatus === 'paid' ? 'text-emerald-600' :
                          booking.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        booking.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Analytics
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
                      <span className="font-medium text-gray-900">{paymentMethods.credit} ({((paymentMethods.credit / totalBookings) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${(paymentMethods.credit / totalBookings) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Debit Card</span>
                      <span className="font-medium text-gray-900">{paymentMethods.debit} ({((paymentMethods.debit / totalBookings) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${(paymentMethods.debit / totalBookings) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Wallet</span>
                      <span className="font-medium text-gray-900">{paymentMethods.wallet} ({((paymentMethods.wallet / totalBookings) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500" style={{ width: `${(paymentMethods.wallet / totalBookings) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Bank Transfer</span>
                      <span className="font-medium text-gray-900">{paymentMethods.bank} ({((paymentMethods.bank / totalBookings) * 100).toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(paymentMethods.bank / totalBookings) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Key Metrics</h3>
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
