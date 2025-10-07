
'use client';
import { agents } from '@/lib/data';

export default function AgentsPage() {
  const aiAgents = agents.filter(a => a.type === 'ai');
  const humanAgents = agents.filter(a => a.type === 'human');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Agent Management</h1>
        <p className="text-gray-500 mt-1">Manage AI and human agents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">AI Agents ({aiAgents.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {aiAgents.map((agent) => (
              <div key={agent.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">🤖</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.skills.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                    agent.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <p className="font-bold text-gray-900">{agent.performanceMetrics.fcr.toFixed(0)}%</p>
                    <p className="text-gray-500">FCR</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{agent.performanceMetrics.csat.toFixed(0)}%</p>
                    <p className="text-gray-500">CSAT</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{agent.performanceMetrics.callsToday}</p>
                    <p className="text-gray-500">Calls</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Human Agents ({humanAgents.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {humanAgents.map((agent) => (
              <div key={agent.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">👤</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.skills.slice(0, 2).join(', ')}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                    agent.status === 'busy' ? 'bg-blue-100 text-blue-800' :
                    agent.status === 'away' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {agent.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-center">
                  <div>
                    <p className="font-bold text-gray-900">{agent.performanceMetrics.fcr.toFixed(0)}%</p>
                    <p className="text-gray-500">FCR</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{agent.performanceMetrics.csat.toFixed(0)}%</p>
                    <p className="text-gray-500">CSAT</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{agent.performanceMetrics.callsToday}</p>
                    <p className="text-gray-500">Calls</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
