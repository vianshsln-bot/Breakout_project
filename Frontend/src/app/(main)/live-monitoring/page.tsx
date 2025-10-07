
'use client';
import { Phone, Radio, Users, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { activeCalls, agents } from '@/lib/data';

export default function LiveMonitoringPage() {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const busyAgents = agents.filter(a => a.status === 'busy').length;
  const availableAgents = agents.filter(a => a.status === 'available').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-8 h-8 text-red-600 animate-pulse" />
            Live Operations
          </h1>
          <p className="text-gray-500 mt-1">Real-time call monitoring and intervention</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View Queue
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Active Calls Monitor</h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-gray-600">{activeCalls.filter(c => c.status === 'active').length} Active</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-gray-600">{activeCalls.filter(c => c.status === 'on-hold').length} On Hold</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span className="text-gray-600">{activeCalls.filter(c => c.status === 'transferring').length} Transferring</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCalls.map((call) => (
                <div key={call.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        call.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                        call.status === 'on-hold' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <span className="text-xs font-medium text-gray-500">
                        {call.status.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{formatDuration(call.duration)}</span>
                  </div>

                  <div className="mb-3">
                    <p className="font-semibold text-gray-900">{call.customerName}</p>
                    <p className="text-sm text-gray-600">{call.agentName}</p>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Sentiment Journey</span>
                      <span className={`font-semibold ${getSentimentColor(call.sentiment)}`}>
                        {call.sentiment.toUpperCase()}
                      </span>
                    </div>
                    <div className="h-8 flex items-end gap-0.5">
                      {Array.from({ length: 10 }, (_, i) => {
                        const height = 20 + Math.random() * 80;
                        const sentiment = height > 60 ? 'bg-emerald-500' : height > 40 ? 'bg-gray-400' : 'bg-red-500';
                        return (
                          <div key={i} className="flex-1">
                            <div className={`w-full ${sentiment} rounded-t`} style={{ height: `${height}%` }} />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded p-2 mb-3">
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Topic:</span> {call.topic}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                      <Phone className="w-3 h-3 inline mr-1" />
                      Join
                    </button>
                    <button className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 transition-colors">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      Message
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Agent Status
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Available</span>
                  <span className="text-2xl font-bold text-emerald-600">{availableAgents}</span>
                </div>
                <div className="h-2 bg-emerald-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600" style={{ width: `${(availableAgents / agents.length) * 100}%` }} />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Busy</span>
                  <span className="text-2xl font-bold text-blue-600">{busyAgents}</span>
                </div>
                <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${(busyAgents / agents.length) * 100}%` }} />
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">Away/Offline</span>
                  <span className="text-2xl font-bold text-gray-600">
                    {agents.length - availableAgents - busyAgents}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Queue Status
            </h2>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Average Wait Time</p>
                <p className="text-3xl font-bold text-gray-900">3.2 min</p>
                <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '64%' }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">Target: 5 min</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Calls in Queue</p>
                <p className="text-3xl font-bold text-gray-900">8</p>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Longest Wait</p>
                <p className="text-3xl font-bold text-red-600">6.4 min</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Urgent Actions
            </h2>
            <div className="space-y-2">
              <div className="p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                <p className="text-sm font-semibold text-red-900">High Queue Alert</p>
                <p className="text-xs text-red-700 mt-1">8 callers waiting. Consider reassigning agents.</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                <p className="text-sm font-semibold text-amber-900">Break Schedule</p>
                <p className="text-xs text-amber-700 mt-1">3 agents on break in 5 minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
