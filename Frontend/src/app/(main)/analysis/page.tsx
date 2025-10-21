
'use client';
import { useState, useEffect } from 'react';
import { KPIMetric, KpiApiResponse } from '@/lib/types';
import { API_BASE_URL } from '@/lib/config';
import { BarChart3 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExecutiveOverview } from './_components/executive-overview';
import { KpiSection } from './_components/kpi-section';
import { AiPerformance } from './_components/ai-performance';
import { QualityAssurance } from './_components/quality-assurance';
import { Alerts } from './_components/alerts';
import { AdditionalAnalytics } from './_components/additional-analytics';
import { useAuth } from '@/context/AuthContext';

const formatDurationFromSeconds = (seconds: number) => {
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')} min`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
};

export default function AnalysisPage() {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [executiveMetrics, setExecutiveMetrics] = useState<KPIMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchKpis = async () => {
      setLoading(true);
      // Don't clear previous error, so UI can show stale data while retrying
      // setError(null);
      try {
        const [kpiResponse, customerKpiResponse, leadsKpiResponse, bookingsKpiResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/compute/kpis`),
            fetch(`${API_BASE_URL}/kpis/customers`),
            fetch(`${API_BASE_URL}/kpis/leads`),
            fetch(`${API_BASE_URL}/kpis/bookings`)
        ]);

        if (!kpiResponse.ok) throw new Error(`HTTP error on main KPIs! Status: ${kpiResponse.status} ${await kpiResponse.text()}`);
        if (!customerKpiResponse.ok) throw new Error(`HTTP error on customer KPIs! Status: ${customerKpiResponse.status} ${await customerKpiResponse.text()}`);
        if (!leadsKpiResponse.ok) throw new Error(`HTTP error on leads KPIs! Status: ${leadsKpiResponse.status} ${await leadsKpiResponse.text()}`);
        if (!bookingsKpiResponse.ok) throw new Error(`HTTP error on bookings KPIs! Status: ${bookingsKpiResponse.status} ${await bookingsKpiResponse.text()}`);
        
        const data: KpiApiResponse = await kpiResponse.json();
        const customerKpiData: {name: string, value: any, unit?: string}[] = await customerKpiResponse.json();
        const leadsKpiData: {name: string, value: any, unit?: string}[] = await leadsKpiResponse.json();
        const bookingsKpiData: {name: string, value: any, unit?: string}[] = await bookingsKpiResponse.json();
        
        const customerKpisObject = customerKpiData.reduce((acc, item) => {
            const key = item.name === 'customer_conversion_rate' ? 'customer_conversion_rate_pct' : item.name;
            acc[key] = item.value;
            return acc;
        }, {} as Record<string, any>);
        
        const leadsKpiObject = leadsKpiData.reduce((acc, item) => {
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
        }, {} as Record<string, any>);

        const bookingsKpiObject = bookingsKpiData.reduce((acc, item) => {
             const keyMap: Record<string, string> = {
                'booking_conversion_rate': 'booking_conversion_rate_pct',
                'cancellation_rate': 'cancellation_rate_pct',
                'repeat_booking_rate': 'repeat_booking_rate_pct',
            };
            const key = keyMap[item.name] || item.name;
            acc[key] = item.value;
            return acc;
        }, {} as Record<string, any>);

        // Merge all KPI sources
        const kpis = { ...data.kpis, ...customerKpisObject, ...leadsKpiObject, ...bookingsKpiObject };
        setError(null); // Clear error on success

        const executiveKpiConfig: { id: keyof KpiApiResponse['kpis']; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' }[] = [
            { id: 'first_call_resolution_pct', label: 'First Call Resolution', target: '>90%', higherIsBetter: true, unit: 'percentage' },
            { id: 'avg_call_duration_sec', label: 'Avg Call Duration', target: '<5 min', higherIsBetter: false, unit: 'seconds' },
            { id: 'call_abandon_rate_pct', label: 'Call Abandon Rate', target: '<5%', higherIsBetter: false, unit: 'percentage' },
            { id: 'customer_satisfaction_avg_rating', label: 'Customer Satisfaction', target: '>4.5', higherIsBetter: true, unit: 'rating' },
            { id: 'missed_calls', label: 'Missed Calls', target: '0', higherIsBetter: false, unit: 'number' },
            { id: 'customer_conversion_rate_pct', label: 'Customer Conversion Rate', target: '>10%', higherIsBetter: true, unit: 'percentage' },
            { id: 'overall_quality_score', label: 'Overall Quality Score', target: '>85', higherIsBetter: true, unit: 'number' },
            { id: 'positive_sentiment_rate_pct', label: 'Positive Sentiment Rate', target: '>80%', higherIsBetter: true, unit: 'percentage' },
        ];

        const detailedKpiConfig: { id: keyof KpiApiResponse['kpis']; label: string; target: string; higherIsBetter: boolean, unit: 'percentage' | 'seconds' | 'number' | 'rating' | 'currency' | 'string' }[] = [
            // Customers
            { id: 'total_customers', label: 'Total Customers', target: '>1000', higherIsBetter: true, unit: 'number' },
            { id: 'new_customers', label: 'New Customers', target: '>50', higherIsBetter: true, unit: 'number' },
            { id: 'avg_spend_per_customer', label: 'Average Spend per Customer', target: '>$500', higherIsBetter: true, unit: 'currency' },
            
            // Leads
            { id: 'total_leads_generated', label: 'Total Leads Generated', target: '>200', higherIsBetter: true, unit: 'number' },
            { id: 'lead_conversion_rate_pct', label: 'Lead Conversion Rate', target: '>15%', higherIsBetter: true, unit: 'percentage' },
            { id: 'lead_response_time_sec', label: 'Lead Response Time', target: '<1hr', higherIsBetter: false, unit: 'seconds' },
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
                const value = kpis[conf.id as keyof typeof kpis] ?? 0;
                let displayValue: string;
                let status: 'good' | 'warning' | 'critical';

                const targetValue = parseFloat(conf.target.replace(/[^\d.-]/g, ''));

                switch (conf.unit) {
                    case 'percentage':
                        displayValue = `${Number(value).toFixed(1)}%`;
                        status = conf.higherIsBetter 
                            ? (Number(value) >= targetValue ? 'good' : 'warning') 
                            : (Number(value) <= targetValue ? 'good' : 'warning');
                        break;
                    case 'seconds':
                        const targetInSeconds = conf.target.includes('hr') ? targetValue * 3600 : targetValue * 60;
                        displayValue = formatDurationFromSeconds(Number(value));
                        status = conf.higherIsBetter 
                            ? (Number(value) >= targetInSeconds ? 'good' : 'warning') 
                            : (Number(value) <= targetInSeconds ? 'good' : 'warning');
                        break;
                    case 'rating':
                        displayValue = `${Number(value).toFixed(1)}/5`;
                        status = Number(value) >= targetValue ? 'good' : 'warning';
                        break;
                    case 'currency':
                        const kValue = (Number(value)/1000);
                        if (kValue > 0) {
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
                        displayValue = value.toString();
                        status = conf.higherIsBetter
                          ? (Number(value) >= targetValue ? 'good' : 'warning')
                          : (Number(value) <= targetValue ? 'good' : 'warning');
                        if (conf.id === 'missed_calls' && Number(value) > 0) status = 'critical';
                }
                
                const generateSparklineData = (currentValue: number, points: number = 8) => {
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
            });
        }
        
        const executiveKpis = processKpis(executiveKpiConfig);
        const allKpis = processKpis(detailedKpiConfig);

        setExecutiveMetrics(executiveKpis);
        setKpiMetrics(allKpis);
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
    
    fetchKpis();
  }, [isAuthenticated]);

  const allMetrics = [...executiveMetrics, ...kpiMetrics];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Hub</h1>
        <p className="text-gray-500 mt-1">Deep dive analytics and AI performance metrics</p>
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
                kpiIds={['total_customers', 'new_customers', 'avg_spend_per_customer']}
                metrics={kpiMetrics}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="leads">
              <KpiSection 
                title="KPIs - Leads"
                kpiIds={['total_leads_generated', 'lead_conversion_rate_pct', 'lead_response_time_sec', 'lead_source_effectiveness', 'qualified_lead_ratio_pct']}
                metrics={kpiMetrics}
                loading={loading}
              />
            </TabsContent>
            <TabsContent value="bookings">
              <KpiSection
                title="KPIs - Bookings"
                kpiIds={['total_bookings', 'booking_conversion_rate_pct', 'avg_booking_value', 'cancellation_rate_pct', 'repeat_booking_rate_pct']}
                metrics={kpiMetrics}
                loading={loading}
              />
            </TabsContent>
          </Tabs>
          
          <AdditionalAnalytics />
          <AiPerformance />
          {/* <QualityAssurance /> */}
          <Alerts metrics={allMetrics} loading={loading} />
        </div>
      </div>
    </div>
  );
}
