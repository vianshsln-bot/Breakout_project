'use client';
import { Phone, Radio, Users, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { activeCalls, agents } from '@/lib/data';

const AgentHelpBar = () => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Agent Help Bar</h2>
      <p className="text-sm text-gray-600 mb-2">Analyzing current call...</p>
      <div className="text-sm text-gray-700">
        <p><strong>Customer Sentiment:</strong> Positive</p>
        <p><strong>Suggested Response:</strong> Offer a discount for loyalty.</p>
      </div>
    </div>
  );
};

const AskMeAnything = () => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        Ask Me Anything
      </h2>
      <div className="h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg mb-4 border">
        {/* Chat messages will go here */}
        <div className="flex justify-start mb-2">
          <div className="bg-blue-100 text-blue-900 rounded-lg p-3 max-w-xs">
            <p>Welcome! How can I help you find information today?</p>
          </div>
        </div>
         <div className="flex justify-end mb-2">
          <div className="bg-gray-200 text-gray-900 rounded-lg p-3 max-w-xs">
            <p>What is the status of order #12345?</p>
          </div>
        </div>
         <div className="flex justify-start mb-2">
          <div className="bg-blue-100 text-blue-900 rounded-lg p-3 max-w-xs">
            <p>Order #12345 is currently 'Shipped' and is expected to arrive in 2 days.</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Type your question..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Send
        </button>
      </div>
    </div>
  );
};

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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <AgentHelpBar />
          <AskMeAnything />
        </div>

        <div className="space-y-6">
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Active Calls</h2>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-gray-600">{activeCalls.filter(c => c.status === 'active').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full" />
                  <span className="text-gray-600">{activeCalls.filter(c => c.status === 'on-hold').length}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {activeCalls.slice(0, 3).map((call) => (
                <div key={call.id} className="border border-gray-200 rounded-lg p-3 hover:border-blue-400 transition-all">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{call.customerName}</p>
                      <p className="text-xs text-gray-600">{call.agentName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{formatDuration(call.duration)}</span>
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        call.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                        call.status === 'on-hold' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
        </div>
      </div>
    </div>
  );
}
