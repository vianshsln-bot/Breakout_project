
'use client';
import { useState, useEffect } from 'react';
import { KPIMetric, KpiApiResponse, Booking, ApiCall as Call, Alert } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/context/AuthContext';

const formatDurationFromSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')} min`;
};

// Helper function to generate plausible sparkline data
const generateSparklineData = (currentValue: number, points: number = 8) => {
  // If currentValue is 0, create a flat line of small non-zero values to avoid division by zero.
  if (currentValue === 0) {
    return Array(points).fill(0.1);
  }
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

const getKpiStatus = (value: number, target: string, higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating'): 'good' | 'warning' | 'critical' => {
    const targetValue = parseFloat(target.replace(/[^\d.-]/g, ''));
    let isGood = false;

    if (unit === 'seconds') {
        // For seconds, the target is in minutes, so we convert it
        isGood = higherIsBetter ? value >= targetValue * 60 : value <= targetValue * 60;
    } else {
        isGood = higherIsBetter ? value >= targetValue : value <= targetValue;
    }

    // Special case for missed calls
    if (unit === 'number' && !higherIsBetter && value > targetValue) {
        return 'critical';
    }

    return isGood ? 'good' : 'warning';
};

export const useDashboardData = () => {
  const { isAuthenticated } = useAuth();
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
    if (!isAuthenticated) return;

    const fetchKpis = async () => {
      setKpiLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/compute/kpis`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch KPIs: ${response.status} ${errorText}`);
        }
        const data: KpiApiResponse = await response.json();
        const kpis = data.kpis;
        setKpiError(null);

        const kpiConfig: { id: 'first_call_resolution_pct' | 'avg_call_duration_sec' | 'call_abandon_rate_pct' | 'customer_satisfaction_avg_rating' | 'missed_calls' | 'customer_conversion_rate_pct' | 'overall_quality_score' | 'positive_sentiment_rate_pct'; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' }[] = [
            { id: 'first_call_resolution_pct', label: 'First Call Resolution', target: '>90%', higherIsBetter: true, unit: 'percentage' },
            { id: 'avg_call_duration_sec', label: 'Avg Call Duration', target: '<5 min', higherIsBetter: false, unit: 'seconds' },
            { id: 'call_abandon_rate_pct', label: 'Call Abandon Rate', target: '<5%', higherIsBetter: false, unit: 'percentage' },
            { id: 'customer_satisfaction_avg_rating', label: 'Customer Satisfaction', target: '>4.0', higherIsBetter: true, unit: 'rating' },
            { id: 'missed_calls', label: 'Missed Calls', target: '0', higherIsBetter: false, unit: 'number' },
            { id: 'customer_conversion_rate_pct', label: 'Customer Conversion Rate', target: '>10%', higherIsBetter: true, unit: 'percentage' },
            { id: 'overall_quality_score', label: 'Overall Quality Score', target: '>85', higherIsBetter: true, unit: 'number' },
            { id: 'positive_sentiment_rate_pct', label: 'Positive Sentiment Rate', target: '>80%', higherIsBetter: true, unit: 'percentage' },
        ];
        
        const mappedKpis: KPIMetric[] = kpiConfig.map(config => {
            const value = kpis[config.id];
            const sparklineData = generateSparklineData(value);
            const trend = getTrend(sparklineData);

            const status = getKpiStatus(value, config.target, config.higherIsBetter, config.unit);

            let displayValue: string;

            switch (config.unit) {
                case 'percentage':
                    displayValue = `${value.toFixed(1)}%`;
                    break;
                case 'seconds':
                    displayValue = formatDurationFromSeconds(value);
                    break;
                case 'rating':
                    displayValue = `${value.toFixed(1)}/5`;
                    break;
                default: // number
                    displayValue = value.toString();
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
          setKpiError('An unexpected error occurred while fetching KPIs.');
        }
      } finally {
        setKpiLoading(false);
      }
    };
    
    const fetchBookings = async () => {
      setBookingsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/bookings/?skip=0&limit=100`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch bookings: ${response.status} ${errorText}`);
        }
        const data: Booking[] = await response.json();
        setRecentBookings(data);
        setBookingsError(null);
      } catch (err) {
        if (err instanceof Error) {
          setBookingsError(err.message);
        } else {
          setBookingsError('An unexpected error occurred while fetching bookings.');
        }
      } finally {
        setBookingsLoading(false);
      }
    };
    
    const fetchCalls = async () => {
      setCallsLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/calls/`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch calls: ${response.status} ${errorText}`);
        }
        const data: Call[] = await response.json();
        setCallsError(null);
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
          setCallsError('An unexpected error occurred while fetching calls.');
        }
      } finally {
        setCallsLoading(false);
      }
    };


    fetchKpis();
    fetchBookings();
    fetchCalls();
  }, [isAuthenticated]);

  return { kpiMetrics, recentBookings, activeCalls, callVolume, alerts, kpiLoading, bookingsLoading, callsLoading, kpiError, bookingsError, callsError };
};
