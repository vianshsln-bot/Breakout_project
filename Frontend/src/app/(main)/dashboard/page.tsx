
'use client';
import { useDashboardData } from '@/hooks/useDashboardData';
import { KpiGrid } from '@/components/dashboard/KpiGrid';
import { ActiveCalls } from '@/components/dashboard/ActiveCalls';
import { RecentBookings } from '@/components/dashboard/RecentBookings';
import { SystemAlerts } from '@/components/dashboard/SystemAlerts';
import { AnalyticsOverview } from '@/components/analytics-overview';
import { useDashboardFilter } from '@/context/DashboardFilterContext';
import { CallVolume } from '@/components/dashboard/CallVolume';
import { SentimentDistribution } from '@/components/dashboard/SentimentDistribution';

function DashboardContent() {
  const { dateRange } = useDashboardFilter();
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
  } = useDashboardData(dateRange);

  return (
    <div className="space-y-6">
      <KpiGrid kpiMetrics={kpiMetrics} kpiLoading={kpiLoading} kpiError={kpiError} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           <AnalyticsOverview />
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


export default function DashboardPage() {
  return (
    <DashboardContent />
  )
}
