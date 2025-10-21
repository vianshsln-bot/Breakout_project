
'use client';
import { useState, useEffect } from 'react';
import { API_CHARTS_BASE_URL } from '@/lib/config';

const defaultChartsConfig = [
  { id: 'calls-trend', title: 'Calls Trend (Last 7 Days)', chartType: 'line', endpoint: 'calls-trend' },
  { id: 'bookings-revenue', title: 'Bookings Trend', chartType: 'bar', endpoint: 'bookings-trend' },
  { id: 'call-sentiment', title: 'Call Sentiment Distribution', chartType: 'call-sentiment', endpoint: 'sentiment-summary' },
  { id: 'customer-growth', title: 'Customer Growth Over Time', chartType: 'area', endpoint: 'customer-growth' },
  { id: 'customer-rating', title: 'Customer Rating Distribution', chartType: 'pie', endpoint: 'dummy-customer-rating' },
  { id: 'intent-distribution', title: 'Intent Distribution', chartType: 'pie', endpoint: 'dummy-intent-distribution' },
];


type ChartConfigItem = {
    id: string;
    title: string;
    chartType: string;
    endpoint: string;
};

// Data transformation functions
const transformCallsTrend = (data: any) => data.dates.map((date: string, index: number) => ({ date, total_calls: data.calls[index] }));
const transformBookingsTrend = (data: any) => data.dates.map((date: string, index: number) => ({ date, bookings: data.bookings[index] }));
const transformLeadFunnel = (data: any) => data.stages.map((stage: string, index: number) => ({ stage, count: data.counts[index] }));
const transformLeadSources = (data: any) => data.sources.map((source: string, index: number) => ({ name: source, value: data.conversions[index] }));
const transformCustomerGrowth = (data: any) => data.dates.map((date: string, index: number) => ({ date, total_customers: data.total[index] }));
const transformRevenueSummary = (data: any) => data.dates.map((date: string, index: number) => ({ date, revenue: data.revenue[index], refunds: data.refunds[index] }));
const transformPaymentsStatus = (data: any) => Object.entries(data).map(([name, value]) => ({ name, value: value as number }));
const transformCallSentiment = (data: any) => Object.entries(data).map(([name, value]) => ({ name, value: value as number }));

const getDummyData = (endpoint: string) => {
    if (endpoint === 'dummy-customer-rating') {
        return [
            { name: '5 Stars', value: 400 },
            { name: '4 Stars', value: 300 },
            { name: '3 Stars', value: 200 },
            { name: '2 Stars', value: 100 },
            { name: '1 Star', value: 50 },
        ];
    }
    if (endpoint === 'dummy-intent-distribution') {
        return [
            { name: 'Booking', value: 250 },
            { name: 'Inquiry', value: 450 },
            { name: 'Complaint', value: 80 },
            { name: 'Modification', value: 120 },
            { name: 'Other', value: 50 },
        ];
    }
    return null;
}

export const useAnalyticsData = (chartsConfig: ChartConfigItem[] = defaultChartsConfig) => {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const fetchData = async (id: string, endpoint: string) => {
      setLoading(prev => ({ ...prev, [id]: true }));

      const dummyData = getDummyData(endpoint);
      if (dummyData) {
        setData(prev => ({ ...prev, [id]: dummyData }));
        setLoading(prev => ({ ...prev, [id]: false }));
        setError(prev => ({ ...prev, [id]: null }));
        return;
      }
      
      try {
        const response = await fetch(`${API_CHARTS_BASE_URL}/${endpoint}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        const result = await response.json();
        
        let transformedData;
        switch(id) {
          case 'calls-trend': transformedData = transformCallsTrend(result); break;
          case 'bookings-revenue': transformedData = transformBookingsTrend(result); break;
          case 'lead-funnel': transformedData = transformLeadFunnel(result); break;
          case 'lead-sources': transformedData = transformLeadSources(result); break;
          case 'customer-growth': transformedData = transformCustomerGrowth(result); break;
          case 'revenue-summary': transformedData = transformRevenueSummary(result); break;
          case 'payments-status': transformedData = transformPaymentsStatus(result); break;
          case 'call-sentiment': transformedData = transformCallSentiment(result); break;
          default: transformedData = result;
        }

        setData(prev => ({ ...prev, [id]: transformedData }));
        setError(prev => ({ ...prev, [id]: null }));
      } catch (e) {
        setError(prev => ({ ...prev, [id]: e instanceof Error ? e.message : 'An error occurred' }));
      } finally {
        setLoading(prev => ({ ...prev, [id]: false }));
      }
    };

    chartsConfig.forEach(chart => fetchData(chart.id, chart.endpoint));
  }, [JSON.stringify(chartsConfig)]);

  return { data, loading, error, chartsConfig };
};
