'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'tassa_admin_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    try {
      const session = localStorage.getItem(ADMIN_SESSION_KEY);
      if (session) {
        const { expiry } = JSON.parse(session);
        if (new Date().getTime() < expiry) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      }
    } catch {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        const expiry = new Date().getTime() + SESSION_DURATION;
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ expiry }));
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
