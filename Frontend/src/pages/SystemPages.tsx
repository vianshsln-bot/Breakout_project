import { MessageSquare, Package, Shield, Users as UsersIcon, Settings as SettingsIcon } from 'lucide-react';
import { whatsappTemplates, themes, agents } from '../data/mockData';

export function WhatsAppAutomation() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">WhatsApp Automation</h1>
        <p className="text-gray-500 mt-1">Messaging intelligence and campaign analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Delivery Rate</p>
          <p className="text-3xl font-bold text-emerald-600">96.2%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Open Rate</p>
          <p className="text-3xl font-bold text-blue-600">89.4%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Click-Through Rate</p>
          <p className="text-3xl font-bold text-purple-600">12.8%</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600 mb-2">Conversion Rate</p>
          <p className="text-3xl font-bold text-emerald-600">4.2%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Message Templates</h2>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            + New Template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {whatsappTemplates.slice(0, 8).map((template) => (
            <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{template.name}</h3>
                  <p className="text-xs text-gray-500">{template.category}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  template.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                  template.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {template.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded p-3 mb-3">
                <p className="text-xs text-gray-700">{template.content}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="font-bold text-gray-900">{template.metrics.sent.toLocaleString()}</p>
                  <p className="text-gray-500">Sent</p>
                </div>
                <div>
                  <p className="font-bold text-emerald-600">{((template.metrics.delivered / template.metrics.sent) * 100).toFixed(1)}%</p>
                  <p className="text-gray-500">Delivered</p>
                </div>
                <div>
                  <p className="font-bold text-blue-600">{((template.metrics.clicked / template.metrics.sent) * 100).toFixed(1)}%</p>
                  <p className="text-gray-500">CTR</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Themes() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Themes & Packages</h1>
          <p className="text-gray-500 mt-1">Manage event packages and pricing</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Create Theme
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {themes.slice(0, 12).map((theme) => (
          <div key={theme.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-gray-900">{theme.name}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  theme.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {theme.status}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">{theme.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price</span>
                  <span className="font-bold text-gray-900">${theme.basePrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bookings</span>
                  <span className="font-bold text-gray-900">{theme.bookings}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue</span>
                  <span className="font-bold text-emerald-600">${theme.revenue.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {theme.features.slice(0, 3).map((feature, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                    {feature}
                  </span>
                ))}
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">Popularity</span>
                  <span className="font-medium">{Math.round(theme.popularity)}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${theme.popularity}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Validation() {
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

export function Agents() {
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

export function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure platform settings and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Access Control</h2>
          <div className="space-y-3">
            <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <p className="font-medium text-gray-900">User Roles</p>
              <p className="text-xs text-gray-500 mt-1">Manage user permissions</p>
            </button>
            <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <p className="font-medium text-gray-900">API Keys</p>
              <p className="text-xs text-gray-500 mt-1">Manage API access</p>
            </button>
            <button className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50">
              <p className="font-medium text-gray-900">Security</p>
              <p className="text-xs text-gray-500 mt-1">Configure security settings</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Integrations</h2>
          <div className="space-y-3">
            {['Stripe', 'Twilio', 'SendGrid', 'Zapier'].map((integration, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                    <Package className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="font-medium text-gray-900">{integration}</span>
                </div>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs rounded font-medium">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            {['Email Alerts', 'SMS Notifications', 'Slack Integration', 'Webhook Events'].map((notif, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <span className="text-sm text-gray-900">{notif}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked={i < 2} />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
