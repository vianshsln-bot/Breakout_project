import { Phone, Users, Clock, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { KPICard } from '../components/KPICard';
import { kpiMetrics, activeCalls, recentBookings, alerts } from '../data/mockData';

export function Dashboard() {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600 bg-emerald-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
  const missedCalls = 4;

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
            {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiMetrics.map((metric) => (
          <KPICard key={metric.id} metric={metric} />
        ))}
      </div>

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
                  <p className="text-2xl font-bold text-gray-900">{queueWaitTime}</p>
                  <p className="text-xs text-gray-500">Avg Wait</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{availableAgents}</p>
                  <p className="text-xs text-gray-500">Available</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{missedCalls}</p>
                  <p className="text-xs text-gray-500">Missed</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeCalls.map((call) => (
                <div key={call.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getSentimentColor(call.sentiment)}`}>
                        {call.sentiment}
                      </div>
                      <p className="font-semibold text-gray-900">{call.customerName}</p>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Agent: {call.agentName}</p>
                    <p className="text-xs text-gray-500 mt-1">{call.topic}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{formatDuration(call.duration)}</p>
                    <p className={`text-xs font-medium mt-1 ${
                      call.status === 'active' ? 'text-emerald-600' :
                      call.status === 'on-hold' ? 'text-amber-600' : 'text-blue-600'
                    }`}>
                      {call.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Call Volume (24h)
              </h3>
              <div className="h-48 flex items-end justify-between gap-1">
                {Array.from({ length: 24 }, (_, i) => {
                  const height = Math.random() * 100 + 20;
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
              <DollarSign className="w-6 h-6 text-emerald-600" />
              Recent Bookings
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentBookings.slice(0, 10).map((booking) => (
                <div key={booking.id} className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-900 text-sm">{booking.customerName}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">{booking.eventType}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-lg font-bold text-emerald-600">${booking.value.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{booking.paymentMethod}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(booking.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              System Alerts
            </h2>
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
          </div>
        </div>
      </div>
    </div>
  );
}
