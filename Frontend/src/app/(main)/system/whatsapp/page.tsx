
'use client';
import { whatsappTemplates } from '@/lib/data';

export default function WhatsAppAutomationPage() {
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
