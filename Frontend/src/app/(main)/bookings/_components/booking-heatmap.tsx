
'use client';

import { Booking } from '@/lib/types';
import { Calendar } from 'lucide-react';
import { useMemo } from 'react';

interface BookingHeatmapProps {
  bookings: Booking[];
  loading: boolean;
}

export function BookingHeatmap({ bookings, loading }: BookingHeatmapProps) {
  const timeSlots = Array.from({ length: 13 }, (_, i) => `${(i + 9).toString().padStart(2, '0')}:00`); // 9am to 9pm
  const prev7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0); // Normalize to start of the day
    return d;
  }).reverse();

  const bookingGrid = useMemo(() => {
    const grid: Record<string, Set<string>> = {};
    for (const booking of bookings) {
      try {
        const startTime = new Date(booking.start_time);
        const dateKey = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate()).toISOString();
        const hourKey = `${startTime.getHours().toString().padStart(2, '0')}:00`;

        if (!grid[dateKey]) {
          grid[dateKey] = new Set();
        }
        grid[dateKey].add(hourKey);
      } catch (e) {
        console.error("Invalid booking date", booking);
      }
    }
    return grid;
  }, [bookings]);

  const renderHeatmap = () => {
    if (loading) {
      return <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />;
    }

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-flow-col-dense" style={{ gridTemplateColumns: `auto repeat(${timeSlots.length}, minmax(0, 1fr))` }}>
          {/* Corner cell */}
          <div className="p-2 border-b border-r border-gray-200 bg-gray-50" />

          {/* Time slots header */}
          {timeSlots.map(slot => (
            <div key={slot} className="p-2 text-center text-xs font-medium text-gray-500 border-b border-gray-200">
              {slot}
            </div>
          ))}

          {/* Date rows */}
          {prev7Days.map(day => {
            const dateKey = day.toISOString();
            const isToday = new Date().toDateString() === day.toDateString();

            return (
              <div key={dateKey} className="grid grid-flow-col-dense contents">
                <div className={`p-2 text-xs font-semibold text-gray-700 border-r border-gray-200 flex items-center justify-end ${isToday ? 'bg-blue-50' : 'bg-gray-50'}`}>
                  {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                {timeSlots.map(slot => {
                  const isBooked = bookingGrid[dateKey]?.has(slot);
                  return (
                    <div
                      key={slot}
                      title={isBooked ? `Booked at ${slot}` : 'Available'}
                      className={`h-12 border-b border-gray-200 transition-colors ${
                        isBooked ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Booking Heatmap (Previous 7 Days)</h2>
      </div>
      {renderHeatmap()}
    </div>
  );
}
