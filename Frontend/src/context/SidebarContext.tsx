'use client';
import { createContext, useContext } from 'react';

// Define the shape of the data you want to share
interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

// Create the context that components will use
const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// Create the custom hook that throws the error if used improperly
export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

// Export the context so the Provider can use it
export default SidebarContext;