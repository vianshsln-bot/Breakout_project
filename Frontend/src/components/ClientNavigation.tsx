'use client';
import { useState, Suspense } from 'react';
import { useUserRole } from '@/context/UserRoleContext';
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
  Menu,
  X
} from 'lucide-react';

function NavigationContent({ sidebarOpen, setSidebarOpen }: { 
  sidebarOpen: boolean; 
  setSidebarOpen: (open: boolean) => void; 
}) {
  const pathname = usePathname();

  const { role } = useUserRole();

  const navigation = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Analytics' },
    { href: '/analysis', label: 'Analysis', icon: BarChart3, section: 'Analytics' },
    { href: '/live-monitoring', label: 'Live Monitoring', icon: Radio, section: 'Analytics' },
    { href: '/customers', label: 'Customers Hub', icon: Users, section: 'Operations' },
    { href: '/calls', label: 'Calls', icon: Phone, section: 'Operations' },
    { href: '/bookings', label: 'Bookings', icon: CalendarCheck, section: 'Operations' },
  { href: '/system/whatsapp', label: 'WhatsApp', icon: MessageSquare, section: 'System', adminOnly: true },
  { href: '/system/themes', label: 'Themes', icon: Palette, section: 'System' },
  { href: '/system/validation', label: 'Validation', icon: Shield, section: 'System', adminOnly: true },
  { href: '/system/agents', label: 'Agents', icon: Bot, section: 'System' },
    { href: '/system/settings', label: 'Settings', icon: SettingsIcon, section: 'System', adminOnly: true }
  ];

  const groupedNav = navigation.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = [];
    acc[item.section].push(item);
    return acc;
  }, {} as Record<string, typeof navigation>);

  return (
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
              if ((item as any).adminOnly && role !== 'admin') return null;
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
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
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
