import { useState } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Radio,
  Users,
  Phone,
  Calendar,
  MessageSquare,
  Package,
  Shield,
  Settings as SettingsIcon,
  Menu,
  X
} from 'lucide-react';
import { Dashboard } from './pages/Dashboard';
import { Analysis } from './pages/Analysis';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { CustomersHub } from './pages/CustomersHub';
import { Calls } from './pages/Calls';
import { Bookings } from './pages/Bookings';
import { WhatsAppAutomation, Themes, Validation, Agents, Settings } from './pages/SystemPages';

type PageType =
  | 'dashboard'
  | 'analysis'
  | 'live'
  | 'customers'
  | 'calls'
  | 'bookings'
  | 'whatsapp'
  | 'themes'
  | 'validation'
  | 'agents'
  | 'settings';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Analytics' },
    { id: 'analysis', label: 'Analysis', icon: BarChart3, section: 'Analytics' },
    { id: 'live', label: 'Live Monitoring', icon: Radio, section: 'Analytics' },
    { id: 'customers', label: 'Customers Hub', icon: Users, section: 'Operations' },
    { id: 'calls', label: 'Calls', icon: Phone, section: 'Operations' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, section: 'Operations' },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, section: 'System' },
    { id: 'themes', label: 'Themes', icon: Package, section: 'System' },
    { id: 'validation', label: 'Validation', icon: Shield, section: 'System' },
    { id: 'agents', label: 'Agents', icon: Users, section: 'System' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, section: 'System' }
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'analysis': return <Analysis />;
      case 'live': return <LiveMonitoring />;
      case 'customers': return <CustomersHub />;
      case 'calls': return <Calls />;
      case 'bookings': return <Bookings />;
      case 'whatsapp': return <WhatsAppAutomation />;
      case 'themes': return <Themes />;
      case 'validation': return <Validation />;
      case 'agents': return <Agents />;
      case 'settings': return <Settings />;
      default: return <Dashboard />;
    }
  };

  const groupedNav = navigation.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } flex flex-col fixed h-full z-10`}
      >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen ? (
            <>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Command</h1>
                <p className="text-xs text-gray-500">Sales & Service</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-100 rounded transition-colors mx-auto"
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          {Object.entries(groupedNav).map(([section, items]) => (
            <div key={section} className="mb-6">
              {sidebarOpen && (
                <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                  {section}
                </p>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setCurrentPage(item.id as PageType)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        currentPage === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {sidebarOpen && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        }`}
      >
        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
