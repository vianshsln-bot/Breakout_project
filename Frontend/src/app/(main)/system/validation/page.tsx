
'use client';
export default function ValidationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quality Assurance & Compliance</h1>
        <p className="text-gray-500 mt-1">System health monitoring and validation</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">System Uptime</p>
          <p className="text-3xl font-bold text-emerald-600">99.98%</p>
          <p className="text-xs text-gray-500 mt-2">Last 30 days</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Compliance Score</p>
          <p className="text-3xl font-bold text-emerald-600">94.2%</p>
          <p className="text-xs text-emerald-600 mt-2">Above target</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Quality Score</p>
          <p className="text-3xl font-bold text-blue-600">89.7%</p>
          <p className="text-xs text-blue-600 mt-2">Trending up</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Violations</p>
          <p className="text-3xl font-bold text-amber-600">3</p>
          <p className="text-xs text-gray-500 mt-2">This month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">System Health</h2>
          <div className="space-y-4">
            {['API Response Time', 'Database Performance', 'AI Model Accuracy', 'Network Latency'].map((metric, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{metric}</span>
                  <span className="text-sm font-bold text-emerald-600">Healthy</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${85 + Math.random() * 15}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Audits</h2>
          <div className="space-y-3">
            {[
              { title: 'PCI DSS Compliance', status: 'passed', date: '2 days ago' },
              { title: 'GDPR Data Review', status: 'passed', date: '5 days ago' },
              { title: 'Security Assessment', status: 'passed', date: '1 week ago' },
              { title: 'Quality Check', status: 'warning', date: '2 weeks ago' }
            ].map((audit, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-900">{audit.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{audit.date}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${
                    audit.status === 'passed' ? 'bg-emerald-100 text-emerald-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {audit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
