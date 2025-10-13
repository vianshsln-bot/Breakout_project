"use client";
import React, { useEffect } from "react";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  CalendarCheck,
  Phone,
  Users,
  Signal,
  BarChart2,
  Settings,
  Bot,
  MessageSquare,
  Shield,
  Palette,
  X,
  Menu
} from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { useUserRole } from '@/context/UserRoleContext';


const analyticsNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/analysis', icon: BarChart2, label: 'Analysis' },
  { href: '/live-monitoring', icon: Signal, label: 'Live Monitoring' },
]

const operationsNav = [
  { href: '/customers', icon: Users, label: 'Customers Hub' },
  { href: '/calls', icon: Phone, label: 'Calls' },
  { href: '/bookings', icon: CalendarCheck, label: 'Bookings' },
]

const systemNav = [
  { href: '/system/whatsapp', icon: MessageSquare, label: 'WhatsApp', adminOnly: true },
  { href: '/system/themes', icon: Palette, label: 'Themes', adminOnly: false },
  { href: '/system/validation', icon: Shield, label: 'Validation', adminOnly: true },
  { href: '/system/agents', icon: Bot, label: 'Agents', adminOnly: false },
  { href: '/system/settings', icon: Settings, label: 'Settings', adminOnly: true },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { state, setOpen } = useSidebar();
  const { role, setRole } = useUserRole();

  // Debug: log role on mount so you can verify the context is wired
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[AppSidebar] mount - role:', role, 'pathname:', pathname, 'sidebarState:', state);
    } catch (e) {}
  }, [role]);

  // Log role changes explicitly
  useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[AppSidebar] role changed ->', role);
    } catch (e) {}
  }, [role]);


  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="group border-r border-gray-200 bg-white text-gray-700"
    >
      <SidebarHeader className="p-4 border-b border-gray-200">
         <div className="flex items-center justify-between">
            <div className="group-data-[collapsible=none]:block group-data-[collapsible=icon]:hidden">
                <h1 className="text-xl font-bold text-gray-900">AI Command</h1>
                <p className="text-xs text-gray-500">Sales & Service</p>
                {/* Header role switch - visible under title when sidebar is expanded */}
                <div className="mt-2">
                  <button
                    type="button"
                    data-role-toggle-header="true"
                    onClick={() => {
                      try {
                        // eslint-disable-next-line no-console
                        console.log('[AppSidebar] header toggle clicked - previous role:', role);
                      } catch (e) {}
                      setRole(role === 'admin' ? 'employee' : 'admin');
                    }}
                    className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  >
                    {role === 'admin' ? 'Switch to Employee' : 'Switch to Admin'}
                  </button>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="group-data-[collapsible=none]:block group-data-[collapsible=icon]:hidden" onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon" className="group-data-[collapsible=icon]:block group-data-[collapsible=none]:hidden mx-auto" onClick={() => setOpen(true)}>
                <Menu className="w-5 h-5 text-gray-600" />
            </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-4">
        <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">Analytics</SidebarGroupLabel>
            <SidebarMenu>
            {analyticsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton
                    isActive={pathname === item.href}
                    tooltip={item.label}
                    className="justify-start gap-3 px-3 py-2 rounded-lg data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 hover:bg-gray-100"
                    >
                    <item.icon className="size-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">Operations</SidebarGroupLabel>
            <SidebarMenu>
            {operationsNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref>
                    <SidebarMenuButton
                     isActive={pathname === item.href}
                    tooltip={item.label}
                    className="justify-start gap-3 px-3 py-2 rounded-lg data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 hover:bg-gray-100"
                    >
                    <item.icon className="size-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            ))}
            </SidebarMenu>
        </SidebarGroup>
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-semibold text-gray-400 uppercase mb-2 px-3">System</SidebarGroupLabel>
      <SidebarMenu>
      {systemNav.map((item) => {
        // adminOnly flag allows hiding items for employee role
        try {
          // eslint-disable-next-line no-console
          console.log('[AppSidebar] system item:', item.label, 'adminOnly:', !!item.adminOnly, 'willRender:', !(item.adminOnly && role !== 'admin'));
        } catch (e) {}
        if (item.adminOnly && role !== 'admin') return null;
        return (
        <SidebarMenuItem key={item.href}>
        <Link href={item.href} passHref>
          <SidebarMenuButton
          isActive={pathname === item.href}
          tooltip={item.label}
           className="justify-start gap-3 px-3 py-2 rounded-lg data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 hover:bg-gray-100"
          >
          <item.icon className="size-5 flex-shrink-0" />
          <span className="text-sm font-medium">{item.label}</span>
          </SidebarMenuButton>
        </Link>
        </SidebarMenuItem>
        );
      })}
      </SidebarMenu>
    </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-200">
         <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="size-10 bg-blue-600">
                <AvatarFallback className="bg-blue-600 text-white font-bold">{role === 'admin' ? 'A' : 'E'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-gray-900">{role === 'admin' ? 'Admin User' : 'Employee User'}</p>
                <p className="text-xs text-gray-500">{role === 'admin' ? 'admin@example.com' : 'employee@example.com'}</p>
            </div>
        </div>
      {/* Role switch moved into footer controls below so it's visible even when sidebar is collapsed */}
      <div className="mt-3 px-4">
        <button
          type="button"
          data-role-toggle="true"
          onClick={() => {
            try {
              // eslint-disable-next-line no-console
              console.log('[AppSidebar] toggle clicked - previous role:', role);
            } catch (e) {}
            setRole(role === 'admin' ? 'employee' : 'admin');
          }}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-sm rounded-md"
          aria-pressed={role === 'admin'}
        >
          <span className="font-medium">Switch to {role === 'admin' ? 'Employee' : 'Admin'}</span>
        </button>
      </div>
      </SidebarFooter>
    </Sidebar>
  );
}
