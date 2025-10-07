
'use client';
import { Package } from 'lucide-react';

export default function SettingsPage() {
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
