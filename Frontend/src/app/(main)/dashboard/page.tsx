'use client';
import { useState, useEffect } from 'react';
import { Phone, AlertTriangle } from 'lucide-react';
import { KPICard } from '@/components/kpi-card';
import { KPIMetric, KpiApiResponse, Booking, ApiCall as Call, Alert } from '@/lib/types';
import { IndianRupee } from 'lucide-react';
import { API_BASE_URL } from '@/lib/config';

const formatDurationFromSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} min`;
};

// Helper function to generate plausible sparkline data
const generateSparklineData = (currentValue: number, points: number = 8) => {
  const data = [currentValue];
  for (let i = 1; i < points; i++) {
    const fluctuation = (Math.random() - 0.5) * (currentValue * 0.2); // Fluctuate by up to 20%
    const previousValue = data[0];
    const newValue = Math.max(0, previousValue + fluctuation);
    data.unshift(newValue);
  }
  return data;
};

// Helper function to determine the trend
const getTrend = (sparklineData: number[]): 'up' | 'down' | 'stable' => {
  if (sparklineData.length < 2) return 'stable';
  const last = sparklineData[sparklineData.length - 1];
  const secondLast = sparklineData[sparklineData.length - 2];
  if (last > secondLast) return 'up';
  if (last < secondLast) return 'down';
  return 'stable';
};


export default function DashboardPage() {
  const [time, setTime] = useState('');
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [activeCalls, setActiveCalls] = useState<Call[]>([]);
  const [callVolume, setCallVolume] = useState<number[]>(Array(24).fill(0));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  const [kpiLoading, setKpiLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [callsLoading, setCallsLoading] = useState(true);

  const [kpiError, setKpiError] = useState<string | null>(null);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [callsError, setCallsError] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);

    const fetchKpis = async () => {
      setKpiLoading(true);
      setKpiError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/compute/kpis`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: KpiApiResponse = await response.json();
        const kpis = data.kpis;

        const kpiConfig: { id: 'first_call_resolution_pct' | 'avg_call_duration_sec' | 'call_abandon_rate_pct' | 'customer_satisfaction_avg_rating' | 'missed_calls' | 'customer_conversion_rate_pct' | 'overall_quality_score' | 'positive_sentiment_rate_pct'; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' }[] = [
            { id: 'first_call_resolution_pct', label: 'First Call Resolution', target: '>90%', higherIsBetter: true, unit: 'percentage' },
            { id: 'avg_call_duration_sec', label: 'Avg Call Duration', target: '<5 min', higherIsBetter: false, unit: 'seconds' },
            { id: 'call_abandon_rate_pct', label: 'Call Abandon Rate', target: '<5%', higherIsBetter: false, unit: 'percentage' },
            { id: 'customer_satisfaction_avg_rating', label: 'Customer Satisfaction', target: '>4.5', higherIsBetter: true, unit: 'rating' },
            { id: 'missed_calls', label: 'Missed Calls', target: '0', higherIsBetter: false, unit: 'number' },
            { id: 'customer_conversion_rate_pct', label: 'Customer Conversion Rate', target: '>10%', higherIsBetter: true, unit: 'percentage' },
            { id: 'overall_quality_score', label: 'Overall Quality Score', target: '>85', higherIsBetter: true, unit: 'number' },
            { id: 'positive_sentiment_rate_pct', label: 'Positive Sentiment Rate', target: '>80%', higherIsBetter: true, unit: 'percentage' },
        ];
        
        const mappedKpis: KPIMetric[] = kpiConfig.map(config => {
            const value = kpis[config.id];
            const sparklineData = generateSparklineData(value);
            const trend = getTrend(sparklineData);

            let displayValue: string;
            let status: 'good' | 'warning' | 'critical';

            const targetValue = parseFloat(config.target.replace(/[^\d.-]/g, ''));

            switch (config.unit) {
                case 'percentage':
                    displayValue = `${value.toFixed(1)}%`;
                    status = config.higherIsBetter 
                        ? (value >= targetValue ? 'good' : 'warning') 
                        : (value <= targetValue ? 'good' : 'warning');
                    break;
                case 'seconds':
                    displayValue = formatDurationFromSeconds(value);
                     status = config.higherIsBetter 
                        ? (value >= targetValue * 60 ? 'good' : 'warning') 
                        : (value <= targetValue * 60 ? 'good' : 'warning');
                    break;
                case 'rating':
                    displayValue = `${value.toFixed(1)}/5`;
                    status = value >= targetValue ? 'good' : 'warning';
                    break;
                default: // number
                    displayValue = value.toString();
                    status = config.higherIsBetter
                      ? (value >= targetValue ? 'good' : 'warning')
                      : (value <= targetValue ? 'good' : 'warning');
                    if (config.id === 'missed_calls' && value > 0) status = 'critical';

            }

            return {
                id: config.id,
                label: config.label,
                value: displayValue,
                target: config.target,
                trend: trend,
                status: status,
                sparklineData: sparklineData,
            };
        });
        
        // const mappedKpis = kpiConfig.map(config => {
        //     const value = kpis[config.id];
            
        //     if (typeof value !== 'number') {
        //         // This dashboard component only handles numeric KPIs.
        //         // We will filter out any non-numeric ones.
        //         return null;
        //     }

        //     const sparklineData = generateSparklineData(value);
        //     const trend = getTrend(sparklineData);

        //     let displayValue: string;
        //     let status: 'good' | 'warning' | 'critical';

        //     const targetValue = parseFloat(config.target.replace(/[^\d.-]/g, ''));

        //     switch (config.unit) {
        //         case 'percentage':
        //             displayValue = `${value.toFixed(1)}%`;
        //             status = config.higherIsBetter 
        //                 ? (value >= targetValue ? 'good' : 'warning') 
        //                 : (value <= targetValue ? 'good' : 'warning');
        //             break;
        //         case 'seconds':
        //             displayValue = formatDurationFromSeconds(value);
        //              status = config.higherIsBetter 
        //                 ? (value >= targetValue * 60 ? 'good' : 'warning') 
        //                 : (value <= targetValue * 60 ? 'good' : 'warning');
        //             break;
        //         case 'rating':
        //             displayValue = `${value.toFixed(1)}/5`;
        //             status = value >= targetValue ? 'good' : 'warning';
        //             break;
        //         default: // number
        //             displayValue = value.toString();
        //             status = config.higherIsBetter
        //               ? (value >= targetValue ? 'good' : 'warning')
        //               : (value <= targetValue ? 'good' : 'warning');
        //             if (config.id === 'missed_calls' && value > 0) status = 'critical';

        //     }

        //     return {
        //         id: config.id,
        //         label: config.label,
        //         value: displayValue,
        //         target: config.target,
        //         trend: trend,
        //         status: status,
        //         sparklineData: sparklineData,
        //     };
        // }).filter((k): k is KPIMetric => k !== null);

        setKpiMetrics(mappedKpis);

        // Generate dynamic alerts
        const newAlerts: Alert[] = [];
        if (kpis.missed_calls > 0) {
            newAlerts.push({
                id: 'alert-missed-calls',
                type: 'critical',
                title: 'Missed Calls Detected',
                message: `${kpis.missed_calls} call(s) were missed. Review agent availability.`,
                timestamp: new Date(),
                read: false,
            });
        }
        if (kpis.call_abandon_rate_pct > 5) {
            newAlerts.push({
                id: 'alert-abandon-rate',
                type: 'warning',
                title: 'High Abandonment Rate',
                message: `Call abandonment is at ${kpis.call_abandon_rate_pct.toFixed(1)}%, exceeding the 5% target.`,
                timestamp: new Date(),
                read: false,
            });
        }
        if (kpis.first_call_resolution_pct < 90) {
             newAlerts.push({
                id: 'alert-fcr',
                type: 'warning',
                title: 'Low First Call Resolution',
                message: `FCR is at ${kpis.first_call_resolution_pct.toFixed(1)}%, below the 90% target.`,
                timestamp: new Date(),
                read: false,
            });
        }
         if (newAlerts.length === 0) {
            newAlerts.push({
                id: 'alert-all-good',
                type: 'info',
                title: 'System Nominal',
                message: 'All key performance indicators are within their target ranges.',
                timestamp: new Date(),
                read: true,
            });
        }
        setAlerts(newAlerts);

      } catch (err) {
        if (err instanceof Error) {
          setKpiError(err.message);
        } else {
          setKpiError('An unexpected error occurred');
        }
      } finally {
        setKpiLoading(false);
      }
    };
    
    const fetchBookings = async () => {
      setBookingsLoading(true);
      setBookingsError(null);
      try {
        console.log("Fetching from:", `${API_BASE_URL}/bookings/?skip=0&limit=100`);
        const response = await fetch(`${API_BASE_URL}/bookings/?skip=0&limit=100`);
        console.log("Response status:", response.status);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        const data: Booking[] = await response.json();
        console.log("Fetched data:", data);
        setRecentBookings(data);
      } catch (err) {
        if (err instanceof Error) {
          setBookingsError(err.message);
        } else {
          setBookingsError('An unexpected error occurred');
        }
      } finally {
        setBookingsLoading(false);
      }
    };
    
    const fetchCalls = async () => {
      setCallsLoading(true);
      setCallsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/calls/`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data: Call[] = await response.json();
        setActiveCalls(data.slice(-5));
        
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const hourlyCounts = Array(24).fill(0);

        data.forEach(call => {
          const callDate = new Date(call.date_time);
          if (callDate >= twentyFourHoursAgo) {
            const hour = callDate.getHours();
            hourlyCounts[hour]++;
          }
        });

        setCallVolume(hourlyCounts);
      } catch (err) {
        if (err instanceof Error) {
          setCallsError(err.message);
        } else {
          setCallsError('An unexpected error occurred');
        }
      } finally {
        setCallsLoading(false);
      }
    };


    fetchKpis();
    fetchBookings();
    fetchCalls();
    
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'failed': case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const queueWaitTime = '3.2 min';
  const activeCallsCount = activeCalls.length;
  const availableAgents = 18;
  const missedCalls = kpiMetrics.find(k => k.id === 'missed_calls')?.value || 0;

  const renderKpiGrid = () => {
    if (kpiLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="p-4 bg-white rounded-lg shadow-sm h-32 animate-pulse" />
          ))}
        </div>
      );
    }

    if (kpiError) {
      return (
        <div className="col-span-full bg-red-50 text-red-700 p-4 rounded-lg text-center">
          <p>Failed to load KPI data.</p>
          <p className="text-sm">{kpiError}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((metric) => (
          <KPICard key={metric.id} metric={metric} />
        ))}
      </div>
    );
  }

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
              <p className="font-semibold text-gray-900 text-sm">Booking #{booking.booking_id}</p>
              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.booking_status)}`}>
                {booking.booking_status}
              </span>
            </div>
            <p className="text-xs text-gray-600">Customer ID: {booking.customer_id}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm font-bold text-gray-800">Guests: {booking.guest_count}</p>
              <p className="text-xs text-gray-500">{new Date(booking.booking_date).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
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

    if (callsError) {
      return (
        <div className="max-h-96 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-red-500 text-center">
            <p>Failed to load active calls.</p>
            <p className="text-sm">{callsError}</p>
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
              <p className={`text-xs font-medium mt-1 text-emerald-600`}>
                ACTIVE
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

    const renderAlerts = () => {
    if (kpiLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg h-20 animate-pulse bg-gray-50" />
          ))}
        </div>
      );
    }
    
    return (
        <div className="space-y-3">
            {alerts.map((alert) => (
                <div
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                    alert.type === 'critical' ? 'bg-red-50 border-red-500' :
                    alert.type === 'warning' ? 'bg-amber-50 border-amber-500' :
                    'bg-blue-50 border-blue-500'
                }`}
                >
                <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-gray-900 text-sm">{alert.title}</p>
                    {!alert.read && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    )}
                </div>
                <p className="text-xs text-gray-600">{alert.message}</p>
                <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                </p>
                </div>
            ))}
            </div>
    );
  };


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Command Center</h1>
          <p className="text-gray-500 mt-1">Real-time operational overview</p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-medium">
            System Online
          </div>
          <div className="px-4 py-2 bg-white border border-gray-200 rounded-lg">
            {time}
          </div>
        </div>
      </div>

      {renderKpiGrid()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Phone className="w-6 h-6 text-blue-600" />
                Active Calls
              </h2>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{activeCallsCount}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{missedCalls}</p>
                  <p className="text-xs text-gray-500">Missed</p>
                </div>
              </div>
            </div>
            {renderActiveCalls()}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                Call Volume (24h)
              </h3>
              <div className="h-48 flex items-end justify-between gap-1">
                {callVolume.map((count, i) => {
                  const maxCount = Math.max(...callVolume);
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const current = new Date().getHours() === i;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full ${current ? 'bg-blue-600' : 'bg-blue-300'} rounded-t transition-all hover:bg-blue-500`}
                        style={{ height: `${height}%` }}
                      />
                      {i % 4 === 0 && (
                        <p className="text-xs text-gray-500 mt-1">{i}h</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sentiment Distribution</h3>
              <div className="flex items-center justify-center h-48">
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="20" />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke="#10b981" strokeWidth="20"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - 0.68)}
                    />
                    <circle
                      cx="50" cy="50" r="40" fill="none" stroke="#6b7280" strokeWidth="20"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 * (1 - 0.68 - 0.22)}
                      style={{ transform: 'rotate(245deg)', transformOrigin: '50% 50%' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-gray-900">68%</p>
                    <p className="text-xs text-gray-500">Positive</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-around mt-4">
                <div className="text-center">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">68%</p>
                  <p className="text-xs text-gray-500">Positive</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">22%</p>
                  <p className="text-xs text-gray-500">Neutral</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1" />
                  <p className="text-sm font-medium">10%</p>
                  <p className="text-xs text-gray-500">Negative</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <IndianRupee className="w-6 h-6 text-emerald-600" />
              Recent Bookings
            </h2>
            {renderRecentBookings()}
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              System Alerts
            </h2>
            {renderAlerts()}
          </div>
        </div>
      </div>
    </div>
  );
}
