'use client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import SidebarContext from '@/context/SidebarContext';
import ClientNavigation from '@/components/ClientNavigation';
import { useUserRole } from '@/context/UserRoleContext';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { role, setRole } = useUserRole();

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen }}>
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
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        // eslint-disable-next-line no-console
                        console.log('[MainLayout] header toggle clicked - previous role:', role);
                        setRole(role === 'admin' ? 'employee' : 'admin');
                      }}
                      className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                      data-role-toggle-main="true"
                    >
                      {role === 'admin' ? 'Switch to Employee' : 'Switch to Admin'}
                    </button>
                  </div>
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

          <ClientNavigation sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

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
            {children}
          </div>
        </main>
      </div>
    </SidebarContext.Provider>
  );
}
