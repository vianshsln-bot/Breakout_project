
'use client';
import { useState, useEffect, useRef } from 'react';
import { API_CHARTS_BASE_URL } from '@/lib/config';

const defaultChartsConfig = [
  { id: 'calls-trend', title: 'Calls Trend', chartType: 'line', endpoint: 'calls-trend' },
  { id: 'bookings-revenue', title: 'Bookings Trend', chartType: 'bar', endpoint: 'bookings-trend' },
  { id: 'call-sentiment', title: 'Call Sentiment Distribution', chartType: 'call-sentiment', endpoint: 'sentiment-summary' },
  { id: 'customer-growth', title: 'Customer Growth', chartType: 'area', endpoint: 'customer-growth' },
  { id: 'customer-rating', title: 'Customer Rating Distribution', chartType: 'pie', endpoint: 'dummy-customer-rating' },
  { id: 'intent-distribution', title: 'Intent Distribution', chartType: 'pie', endpoint: 'dummy-intent-distribution' },
];


type ChartConfigItem = {
    id: string;
    title: string;
    chartType: string;
    endpoint: string;
};

type FilterType = 'daily' | 'weekly' | 'quarterly' | 'half_yearly' | 'yearly';

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

export const useAnalyticsData = (chartsConfig: ChartConfigItem[] = defaultChartsConfig, filter?: FilterType) => {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<Record<string, string | null>>({});
  const [retrying, setRetrying] = useState<Record<string, boolean>>({});

  const retryTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    const fetchDataWithRetry = async (id: string, endpoint: string, attempt = 1) => {
      setLoading(prev => ({ ...prev, [id]: attempt === 1 }));
      setError(prev => ({ ...prev, [id]: null }));

      const dummyData = getDummyData(endpoint);
      if (dummyData) {
        setData(prev => ({ ...prev, [id]: dummyData }));
        setLoading(prev => ({ ...prev, [id]: false }));
        setRetrying(prev => ({ ...prev, [id]: false }));
        return;
      }
      
      try {
        const url = filter ? `${API_CHARTS_BASE_URL}/${endpoint}?filter=${filter}` : `${API_CHARTS_BASE_URL}/${endpoint}`;
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status} - ${errorText || response.statusText}`);
        }
        const result = await response.json();
        
        if (result.message && result.message.includes("No data available")) {
            setData(prev => ({...prev, [id]: []}));
        } else {
            let transformedData;
            switch(id) {
              case 'calls-trend': transformedData = result.dates ? transformCallsTrend(result) : []; break;
              case 'bookings-revenue': transformedData = result.dates ? transformBookingsTrend(result) : []; break;
              case 'lead-funnel': transformedData = result.stages ? transformLeadFunnel(result) : []; break;
              case 'lead-sources': transformedData = result.sources ? transformLeadSources(result) : []; break;
              case 'customer-growth': transformedData = result.dates ? transformCustomerGrowth(result) : []; break;
              case 'revenue-summary': transformedData = result.dates ? transformRevenueSummary(result) : []; break;
              case 'payments-status': transformedData = Object.keys(result).length > 0 ? transformPaymentsStatus(result) : []; break;
              case 'call-sentiment': transformedData = Object.keys(result).length > 0 ? transformCallSentiment(result) : []; break;
              default: transformedData = result.charts || result || [];
            }
            setData(prev => ({ ...prev, [id]: Array.isArray(transformedData) ? transformedData : [] }));
        }
        
        setError(prev => ({ ...prev, [id]: null }));
        setRetrying(prev => ({ ...prev, [id]: false }));

      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred while fetching analytics data.';
        setError(prev => ({ ...prev, [id]: errorMessage }));
        
        if (attempt < 5) { // Retry up to 5 times
            setRetrying(prev => ({ ...prev, [id]: true }));
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            retryTimeouts.current[id] = setTimeout(() => {
                fetchDataWithRetry(id, endpoint, attempt + 1);
            }, delay);
        } else {
            setRetrying(prev => ({ ...prev, [id]: false })); // Max retries reached
        }
      } finally {
         if (attempt === 1) {
            setLoading(prev => ({ ...prev, [id]: false }));
        }
      }
    };

    chartsConfig.forEach(chart => {
        // Clear any pending retries for this chart before starting a new fetch
        if (retryTimeouts.current[chart.id]) {
            clearTimeout(retryTimeouts.current[chart.id]);
        }
        fetchDataWithRetry(chart.id, chart.endpoint);
    });

    // Cleanup timeouts on unmount or when dependencies change
    return () => {
        Object.values(retryTimeouts.current).forEach(clearTimeout);
    };
  }, [JSON.stringify(chartsConfig), filter]);

  return { data, loading, error, isRetrying: retrying, chartsConfig };
};
