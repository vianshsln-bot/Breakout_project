
'use client';
import { Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  BarChart3,
  Radio,
  Users,
  Phone,
  CalendarCheck,
  MessageSquare,
  Palette,
  Shield,
  Bot,
  Settings as SettingsIcon,
  Icon,
} from 'lucide-react';
import navigationConfig from '@/config/roles.json';

const iconMap: { [key: string]: Icon } = {
  LayoutDashboard,
  BarChart3,
  Radio,
  Users,
  Phone,
  CalendarCheck,
  MessageSquare,
  Palette,
  Shield,
  Bot,
  SettingsIcon,
};


function NavigationContent({ sidebarOpen }: { 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void; 
}) {
  const pathname = usePathname();
  const { user } = useAuth();

  const userRole = user?.role || 'employee';

  return (
    <nav className="flex-1 overflow-y-auto p-4">
      {navigationConfig.main.map((section) => {
        const accessibleItems = section.items.filter(item => item.roles.includes(userRole));
        if (accessibleItems.length === 0) return null;

        return (
          <div key={section.section} className="mb-6">
            {sidebarOpen && (
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">
                {section.section}
              </p>
            )}
            <div className="space-y-1">
              {accessibleItems.map((item) => {
                const Icon = iconMap[item.icon];
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      pathname === item.href
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.label}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function ClientNavigation({ 
  sidebarOpen, 
  setSidebarOpen 
}: { 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void; 
}) {
  return (
    <Suspense fallback={
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </nav>
    }>
      <NavigationContent sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
    </Suspense>
  );
}
