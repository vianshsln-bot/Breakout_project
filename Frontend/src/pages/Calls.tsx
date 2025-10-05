import { useState } from 'react';
import { Phone, Search, Filter, Play, TrendingUp } from 'lucide-react';
import { calls } from '../data/mockData';

export function Calls() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState<typeof calls[0] | null>(null);

  const filteredCalls = calls
    .filter(c =>
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.agentName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 50);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Call Management</h1>
          <p className="text-gray-500 mt-1">Comprehensive call analysis and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Total Calls</p>
          <p className="text-3xl font-bold text-gray-900">{calls.length}</p>
          <p className="text-xs text-emerald-600 mt-2">+12% vs last period</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Avg Duration</p>
          <p className="text-3xl font-bold text-gray-900">6.2 min</p>
          <p className="text-xs text-blue-600 mt-2">-8% improvement</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">AI Handled</p>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round((calls.filter(c => c.agentType === 'ai').length / calls.length) * 100)}%
          </p>
          <p className="text-xs text-purple-600 mt-2">1,240 calls</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Positive Sentiment</p>
          <p className="text-3xl font-bold text-gray-900">
            {Math.round((calls.filter(c => c.sentiment === 'positive').length / calls.length) * 100)}%
          </p>
          <p className="text-xs text-emerald-600 mt-2">Trending up</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls by customer or agent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredCalls.map((call) => (
              <div
                key={call.id}
                onClick={() => setSelectedCall(call)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedCall?.id === call.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{call.customerName}</p>
                    <p className="text-sm text-gray-600">
                      {call.agentType === 'ai' ? '🤖' : '👤'} {call.agentName}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      call.sentiment === 'positive' ? 'bg-emerald-100 text-emerald-800' :
                      call.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {call.sentiment}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">{Math.floor(call.duration / 60)}m {call.duration % 60}s</p>
                  </div>
                </div>

                <div className="flex gap-2 mb-2">
                  {call.topics.map((topic, i) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                      {topic}
                    </span>
                  ))}
                </div>

                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>{new Date(call.startTime).toLocaleString()}</span>
                  <span className={`font-medium ${
                    call.outcome === 'resolved' ? 'text-emerald-600' :
                    call.outcome === 'abandoned' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {call.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          {selectedCall ? (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Call Details</h3>
                <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Play className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedCall.customerName}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Agent</p>
                  <p className="font-semibold text-gray-900">
                    {selectedCall.agentType === 'ai' ? '🤖 ' : '👤 '}
                    {selectedCall.agentName}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {Math.floor(selectedCall.duration / 60)}m {selectedCall.duration % 60}s
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Sentiment Journey</p>
                  <div className="h-20 flex items-end gap-1 bg-gray-50 rounded p-2">
                    {selectedCall.sentimentJourney.map((val, i) => (
                      <div key={i} className="flex-1">
                        <div
                          className={`w-full rounded-t ${
                            val > 60 ? 'bg-emerald-500' :
                            val > 40 ? 'bg-gray-400' : 'bg-red-500'
                          }`}
                          style={{ height: `${val}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Quality Score</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${selectedCall.qualityScore}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-900">{selectedCall.qualityScore.toFixed(0)}%</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Intent Recognition</p>
                  <div className="flex items-center gap-2">
                    {selectedCall.intentRecognized ? (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded font-medium">
                        ✓ Recognized ({selectedCall.intentAccuracy.toFixed(0)}%)
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded font-medium">
                        ✗ Failed
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Transcript</p>
                  <div className="p-3 bg-gray-50 rounded text-xs text-gray-700 max-h-40 overflow-y-auto">
                    {selectedCall.transcript}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Cost</p>
                  <p className="font-bold text-gray-900">${selectedCall.cost.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-500">Select a call to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
