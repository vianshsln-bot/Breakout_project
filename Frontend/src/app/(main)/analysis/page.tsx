
'use client';
import { useState, useEffect } from 'react';
import { KPIMetric, KpiApiResponse } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExecutiveOverview } from './_components/executive-overview';
import { KpiSection } from './_components/kpi-section';
import { AiPerformance } from './_components/ai-performance';
import { Alerts } from './_components/alerts';
import { AdditionalAnalytics } from './_components/additional-analytics';
import { useAuth } from '@/context/AuthContext';
import { useDashboardFilter } from '@/context/DashboardFilterContext';

const formatDurationFromSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function AnalysisPage() {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [executiveMetrics, setExecutiveMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const { dateRange } = useDashboardFilter();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchKpis = async () => {
      setLoading(true);
      setError(null);
      // Reset state on new fetch
      setExecutiveMetrics([]);
      setKpiMetrics([]);

      try {
        // Fetch main KPIs first
        const mainKpiUrl = `${API_BASE_URL}/compute/kpis?filter=${dateRange}`;
        const mainKpiResponse = await fetch(mainKpiUrl, { signal });
        if (!mainKpiResponse.ok) {
            const errorText = await mainKpiResponse.text();
            throw new Error(`Failed to fetch main KPIs: ${mainKpiResponse.status} ${errorText || mainKpiResponse.statusText}`);
        }
        const mainKpiData: KpiApiResponse = await mainKpiResponse.json();

        // Fetch supplemental KPIs gracefully
        const supplementalUrls = {
            customers: `${API_BASE_URL}/kpis/customers?filter=${dateRange}`,
            leads: `${API_BASE_URL}/kpis/leads?filter=${dateRange}`,
            bookings: `${API_BASE_URL}/kpis/bookings?filter=${dateRange}`,
        };

        const supplementalResponses = await Promise.all(
            Object.values(supplementalUrls).map(url => fetch(url, { signal }).catch(e => e))
        );

        const [customerKpiResponse, leadsKpiResponse, bookingsKpiResponse] = supplementalResponses;
        
        // Process supplemental data if the fetch was successful
        const customerKpiData = (customerKpiResponse instanceof Response && customerKpiResponse.ok) ? await customerKpiResponse.json() : null;
        const leadsKpiData = (leadsKpiResponse instanceof Response && leadsKpiResponse.ok) ? await leadsKpiResponse.json() : null;
        const bookingsKpiData = (bookingsKpiResponse instanceof Response && bookingsKpiResponse.ok) ? await bookingsKpiResponse.json() : null;

        const customerKpisObject = customerKpiData && Array.isArray(customerKpiData) ? customerKpiData.reduce((acc, item) => {
            const key = item.name === 'customer_conversion_rate' ? 'customer_conversion_rate_pct' : item.name;
            acc[key] = item.value;
            return acc;
        }, {} as Record<string, any>) : {};
        
        const leadsKpiObject = leadsKpiData && Array.isArray(leadsKpiData) ? leadsKpiData.reduce((acc, item) => {
            const keyMap: Record<string, string> = {
                'lead_conversion_rate': 'lead_conversion_rate_pct',
                'avg_lead_response_time': 'lead_response_time_sec',
                'best_lead_source': 'lead_source_effectiveness',
                'qualified_lead_ratio': 'qualified_lead_ratio_pct'
            };
            const key = keyMap[item.name] || item.name;
            let value = item.value;
            if (item.name === 'avg_lead_response_time' && item.unit === 'hours') {
                value = value * 3600; // convert hours to seconds
            }
            acc[key] = value;
            return acc;
        }, {} as Record<string, any>) : {};

        const bookingsKpiObject = bookingsKpiData && Array.isArray(bookingsKpiData) ? bookingsKpiData.reduce((acc, item) => {
            const keyMap: Record<string, string> = {
                'booking_conversion_rate': 'booking_conversion_rate_pct',
                'cancellation_rate': 'cancellation_rate_pct',
                'repeat_booking_rate': 'repeat_booking_rate_pct',
            };
            const key = keyMap[item.name] || item.name;
            acc[key] = item.value;
            return acc;
        }, {} as Record<string, any>) : {};

        // Merge all KPI sources
        const kpis = { ...mainKpiData.kpis, ...customerKpisObject, ...leadsKpiObject, ...bookingsKpiObject };

        const executiveKpiConfig: { id: keyof typeof kpis; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' }[] = [
            { id: 'first_call_resolution_pct', label: 'First Call Resolution', target: '>90%', higherIsBetter: true, unit: 'percentage' },
            { id: 'avg_call_duration_sec', label: 'Avg Call Duration', target: '<300s', higherIsBetter: false, unit: 'seconds' },
            { id: 'call_abandon_rate_pct', label: 'Call Abandon Rate', target: '<5%', higherIsBetter: false, unit: 'percentage' },
            { id: 'missed_calls', label: 'Missed Calls', target: '0', higherIsBetter: false, unit: 'number' },
            { id: 'overall_quality_score', label: 'Overall Quality Score', target: '>85', higherIsBetter: true, unit: 'number' },
            { id: 'positive_sentiment_rate_pct', label: 'Positive Sentiment Rate', target: '>80%', higherIsBetter: true, unit: 'percentage' },
        ];

        const detailedKpiConfig: { id: keyof typeof kpis; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' | 'currency' | 'string' }[] = [
            // Customers
            { id: 'total_customers', label: 'Total Customers', target: '>1000', higherIsBetter: true, unit: 'number' },
            { id: 'new_customers', label: 'New Customers', target: '>50', higherIsBetter: true, unit: 'number' },
            { id: 'avg_spend_per_customer', label: 'Average Spend per Customer', target: '>$500', higherIsBetter: true, unit: 'currency' },
            { id: 'customer_satisfaction_avg_rating', label: 'Customer Satisfaction', target: '>4.0', higherIsBetter: true, unit: 'rating' },
            { id: 'customer_conversion_rate_pct', label: 'Customer Conversion Rate', target: '>10%', higherIsBetter: true, unit: 'percentage' },

            // Leads
            { id: 'total_leads_generated', label: 'Total Leads Generated', target: '>200', higherIsBetter: true, unit: 'number' },
            { id: 'lead_conversion_rate_pct', label: 'Lead Conversion Rate', target: '>15%', higherIsBetter: true, unit: 'percentage' },
            { id: 'lead_response_time_sec', label: 'Lead Response Time', target: '<3600s', higherIsBetter: false, unit: 'seconds' },
            { id: 'lead_source_effectiveness', label: 'Lead Source Effectiveness', target: 'N/A', higherIsBetter: true, unit: 'string' },
            { id: 'qualified_lead_ratio_pct', label: 'Qualified Lead Ratio (SQL/MQL)', target: '>60%', higherIsBetter: true, unit: 'percentage' },

            // Bookings
            { id: 'total_bookings', label: 'Total Bookings', target: '>100', higherIsBetter: true, unit: 'number' },
            { id: 'booking_conversion_rate_pct', label: 'Booking Conversion Rate', target: '>25%', higherIsBetter: true, unit: 'percentage' },
            { id: 'avg_booking_value', label: 'Average Booking Value (ABV)', target: '>$800', higherIsBetter: true, unit: 'currency' },
            { id: 'cancellation_rate_pct', label: 'Cancellation Rate', target: '<5%', higherIsBetter: false, unit: 'percentage' },
            { id: 'repeat_booking_rate_pct', label: 'Repeat Booking Rate', target: '>20%', higherIsBetter: true, unit: 'percentage' },
        ];

        const processKpis = (config: any[]): KPIMetric[] => {
            return config.map(conf => {
                const value = kpis[conf.id as keyof typeof kpis];
                
                // If value is missing or null, return a placeholder
                if (value === undefined || value === null) {
                    return {
                        id: conf.id,
                        label: conf.label,
                        value: '-',
                        target: conf.target,
                        trend: 'stable',
                        status: 'warning',
                        sparklineData: Array(8).fill(0),
                    };
                }

                let displayValue: string;
                let status: 'good' | 'warning' | 'critical';

                const targetValue = parseFloat(conf.target.replace(/[^\d.-]/g, ''));

                switch (conf.unit) {
                    case 'percentage':
                        displayValue = `${Number(value).toFixed(2)}%`;
                        status = conf.higherIsBetter 
                            ? (Number(value) >= targetValue ? 'good' : 'warning') 
                            : (Number(value) <= targetValue ? 'good' : 'warning');
                        break;
                    case 'seconds':
                        displayValue = formatDurationFromSeconds(Number(value));
                        status = conf.higherIsBetter 
                            ? (Number(value) >= targetValue ? 'good' : 'warning') 
                            : (Number(value) <= targetValue ? 'good' : 'warning');
                        break;
                    case 'rating':
                        displayValue = `${Number(value).toFixed(2)}/5`;
                        status = Number(value) >= targetValue ? 'good' : 'warning';
                        break;
                    case 'currency':
                        const kValue = (Number(value)/1000);
                        if (Math.abs(kValue) >= 1) {
                            displayValue = `$${kValue.toFixed(1)}k`;
                        } else {
                             displayValue = `$${Number(value).toFixed(2)}`;
                        }
                        status = conf.higherIsBetter
                            ? (Number(value) >= targetValue ? 'good' : 'warning')
                            : (Number(value) <= targetValue ? 'good' : 'warning');
                        break;
                    case 'string':
                        displayValue = value.toString();
                        status = 'good';
                        break;
                    default: // number
                        displayValue = Number.isInteger(value) ? value.toString() : Number(value).toFixed(2);
                        status = conf.higherIsBetter
                          ? (Number(value) >= targetValue ? 'good' : 'warning')
                          : (Number(value) <= targetValue ? 'good' : 'warning');
                        if (conf.id === 'missed_calls' && Number(value) > 0) status = 'critical';
                }
                
                const generateSparklineData = (currentValue: number, points: number = 8) => {
                  if (currentValue === 0) return Array(points).fill(0);
                  const data = [currentValue];
                  for (let i = 1; i < points; i++) {
                    const fluctuation = (Math.random() - 0.5) * (currentValue * 0.2);
                    const previousValue = data[0];
                    const newValue = Math.max(0, previousValue + fluctuation);
                    data.unshift(newValue);
                  }
                  return data;
                };

                const getTrend = (sparklineData: number[]): 'up' | 'down' | 'stable' => {
                  if (sparklineData.length < 2) return 'stable';
                  const last = sparklineData[sparklineData.length - 1];
                  const secondLast = sparklineData[sparklineData.length - 2];
                  if (last > secondLast) return 'up';
                  if (last < secondLast) return 'down';
                  return 'stable';
                };
                
                const sparklineData = generateSparklineData(Number(value));
                const trend = getTrend(sparklineData);

                return {
                    id: conf.id,
                    label: conf.label,
                    value: displayValue,
                    target: conf.target,
                    trend: trend,
                    status: status,
                    sparklineData: sparklineData,
                };
            }).filter(Boolean) as KPIMetric[];
        }
        
        const execKpis = processKpis(executiveKpiConfig);
        const allOtherKpis = processKpis(detailedKpiConfig);

        setExecutiveMetrics(execKpis);
        setKpiMetrics(allOtherKpis);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        if (err instanceof Error) {
          setError(`Failed to load key analytics: ${err.message}`);
        } else {
          setError('An unexpected error occurred. Please check the console for more details.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchKpis();

    return () => {
      controller.abort();
    };
  }, [isAuthenticated, dateRange]);

  const allMetrics = [...executiveMetrics, ...kpiMetrics];
  
  const customerKpiIds = ['total_customers', 'new_customers', 'avg_spend_per_customer', 'customer_satisfaction_avg_rating', 'customer_conversion_rate_pct'];
  const leadKpiIds = ['total_leads_generated', 'lead_conversion_rate_pct', 'lead_response_time_sec', 'lead_source_effectiveness', 'qualified_lead_ratio_pct'];
  const bookingKpiIds = ['total_bookings', 'booking_conversion_rate_pct', 'avg_booking_value', 'cancellation_rate_pct', 'repeat_booking_rate_pct'];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Hub</h1>
            <p className="text-gray-500 mt-1">Deep dive analytics and AI performance metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Executive Overview</h2>
            </div>
            <ExecutiveOverview metrics={executiveMetrics} loading={loading} error={error} />
          </div>

          <Tabs defaultValue="customers" className="space-y-4">
            <TabsList>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="leads">Leads</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>
            <TabsContent value="customers">
              <KpiSection 
                title="KPIs - Customers" 
                kpiIds={customerKpiIds}
                metrics={kpiMetrics}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="leads">
              <KpiSection 
                title="KPIs - Leads"
                kpiIds={leadKpiIds}
                metrics={kpiMetrics}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="bookings">
              <KpiSection
                title="KPIs - Bookings"
                kpiIds={bookingKpiIds}
                metrics={kpiMetrics}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
          
          <AdditionalAnalytics filter={dateRange} />
          <AiPerformance filter={dateRange} />
          {/* <QualityAssurance /> */}
          <Alerts metrics={allMetrics} loading={loading} />
        </div>
      </div>
    </div>
  );
}
