'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import SidebarContext from '@/context/SidebarContext';
import ClientNavigation from '@/components/ClientNavigation';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarProvider } from '@/components/ui/sidebar';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || !isAuthenticated) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
    );
  }

  return <>{children}</>;
}


export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  return (
    <AuthGuard>
      <SidebarProvider>
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
                  <Avatar>
                      <AvatarFallback className="bg-blue-600 text-white font-bold">
                          {user?.email?.[0].toUpperCase() ?? 'U'}
                      </AvatarFallback>
                  </Avatar>
                  {sidebarOpen && (
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">{user?.role} User</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
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
      </SidebarProvider>
    </AuthGuard>
  );
}
