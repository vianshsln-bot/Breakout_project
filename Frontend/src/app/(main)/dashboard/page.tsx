
'use client';
import { useDashboardData } from '@/hooks/useDashboardData';
import { Header } from '@/components/dashboard/Header';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { ActiveCalls } from '@/components/dashboard/ActiveCalls';
import { CallVolume } from '@/components/dashboard/CallVolume';
import { SentimentDistribution } from '@/components/dashboard/SentimentDistribution';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';
import { AnalyticsOverview } from '@/components/analytics-overview';

export default function DashboardPage() {
  const { 
    kpiMetrics, 
    recentBookings, 
    activeCalls, 
    callVolume, 
    alerts, 
    kpiLoading, 
    bookingsLoading, 
    callsLoading, 
    kpiError, 
    bookingsError, 
    callsError 
  } = useDashboardData();

  return (
    <div className="space-y-6">
      <Header />

      <KpiGrid kpiMetrics={kpiMetrics} kpiLoading={kpiLoading} kpiError={kpiError} />

      <AnalyticsOverview />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActiveCalls 
            activeCalls={activeCalls} 
            callsLoading={callsLoading} 
            callsError={callsError} 
          />
        </div>

        <div className="space-y-6">
          <RecentBookings 
            recentBookings={recentBookings} 
            bookingsLoading={bookingsLoading} 
            bookingsError={bookingsError} 
          />
          <SystemAlerts alerts={alerts} kpiLoading={kpiLoading} />
        </div>
      </div>
    </div>
  );
}
