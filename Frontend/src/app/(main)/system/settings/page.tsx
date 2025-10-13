
'use client';
import { useState } from 'react';
import { User, Globe, Bell, AlertTriangle, Package, Key, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type SettingsTab = 'profile' | 'language' | 'integrations' | 'notifications' | 'alerts' | 'access';

export default function SettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [profile, setProfile] = useState({ name: 'Admin User', email: 'admin@example.com' });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const saveProfile = () => {
    console.log('Saving profile:', profile);
    // Here you would typically make an API call to save the data
    toast({
      title: "Profile Saved",
      description: "Your profile information has been updated.",
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>
              <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Changes</button>
            </div>
          </div>
        );
      case 'language':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Language & Region</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Language</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option>English (United States)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Timezone</label>
                <select className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                  <option>Pacific Time (US & Canada)</option>
                  <option>Mountain Time (US & Canada)</option>
                  <option>Central Time (US & Canada)</option>
                  <option>Eastern Time (US & Canada)</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'integrations':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Integrations</h2>
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
        );
      case 'notifications':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
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
        );
      case 'alerts':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Alerts</h2>
            <p className="text-gray-600">Configure thresholds and recipients for critical system alerts.</p>
            {/* Alert configuration UI would go here */}
          </div>
        );
      case 'access':
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Access Control</h2>
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
        );
      default:
        return null;
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'integrations', label: 'Integrations', icon: Package },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'access', label: 'Access Control', icon: Key },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure platform settings and integrations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <nav className="space-y-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
