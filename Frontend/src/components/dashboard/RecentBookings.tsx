
'use client';
import { IndianRupee } from 'lucide-react';
import { Booking } from '@/lib/types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'confirmed':
    case 'paid': return 'bg-emerald-100 text-emerald-800';
    case 'pending': return 'bg-amber-100 text-amber-800';
    case 'failed':
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const RecentBookings = ({ recentBookings, bookingsLoading, bookingsError }: { recentBookings: Booking[], bookingsLoading: boolean, bookingsError: string | null }) => {
  const renderRecentBookings = () => {
    if (bookingsLoading) {
      return (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 border border-gray-200 rounded-lg h-24 animate-pulse bg-gray-50" />
          ))}
        </div>
      );
    }

    if (bookingsError) {
      return (
        <div className="max-h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-red-500 text-center">
            <p>Failed to load bookings.</p>
            <p className="text-sm">{bookingsError}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {recentBookings.slice(0, 10).map((booking) => (
          <div key={booking.booking_id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold text-gray-900 text-sm">Booking #{booking.booking_id.slice(-6)}</p>
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
            </div>
            <p className="text-xs text-gray-600">Customer ID: {booking.customer_id.slice(-6)}</p>
            <div className="flex justify-between items-center mt-2">
               <p className="text-xs text-gray-500">{new Date(booking.creation_time).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <IndianRupee className="w-6 h-6 text-emerald-600" />
        Recent Bookings
      </h2>
      {renderRecentBookings()}
    </div>
  );
};
