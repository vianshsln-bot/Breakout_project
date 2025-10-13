"use client";
import { createContext, useContext, useEffect, useState } from 'react';

export type Role = 'admin' | 'employee';

type UserRoleContextValue = {
  role: Role;
  setRole: (r: Role) => void;
};

const UserRoleContext = createContext<UserRoleContextValue | undefined>(undefined);

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('employee');

  // Load saved role (for dev/demo) and persist when changed
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userRole');
      if (stored === 'admin' || stored === 'employee') setRole(stored);
    } catch (e) {
      // ignore (SSR safety)
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('userRole', role);
    } catch (e) {
      // ignore
    }
  }, [role]);

  return <UserRoleContext.Provider value={{ role, setRole }}>{children}</UserRoleContext.Provider>;
}

export function useUserRole() {
  const ctx = useContext(UserRoleContext);
  if (!ctx) {
    // Fallback to employee when provider is not mounted to avoid runtime errors
    return {
      role: 'employee' as Role,
      setRole: (_: Role) => {},
    } as UserRoleContextValue;
  }
  return ctx;
}
