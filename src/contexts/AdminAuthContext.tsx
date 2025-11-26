'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'tassa_admin_session';

interface SessionData {
  token: string;
  expiry: number;
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Check for existing session on mount - verify with server
  useEffect(() => {
    const verifySession = async () => {
      try {
        const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY);
        if (!sessionStr) {
          setIsLoading(false);
          return;
        }

        const session: SessionData = JSON.parse(sessionStr);
        
        // First check if locally expired
        if (new Date().getTime() >= session.expiry || !session.token) {
          localStorage.removeItem(ADMIN_SESSION_KEY);
          setIsLoading(false);
          return;
        }

        // Verify session with server
        const response = await fetch('/api/admin/auth', {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.token}` },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            setSessionToken(session.token);
            setIsAuthenticated(true);
          } else {
            // Server says session is invalid - clear local storage
            localStorage.removeItem(ADMIN_SESSION_KEY);
          }
        } else {
          // Session not valid on server - clear local storage
          localStorage.removeItem(ADMIN_SESSION_KEY);
        }
      } catch {
        // On error, clear session for security
        localStorage.removeItem(ADMIN_SESSION_KEY);
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login = useCallback(async (password: string): Promise<boolean> => {
    setError(null);
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include', // Include cookies
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage for API calls
        const sessionData: SessionData = {
          token: data.token,
          expiry: data.expiry,
        };
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(sessionData));
        setSessionToken(data.token);
        setIsAuthenticated(true);
        return true;
      }

      // Handle specific error cases
      if (response.status === 429) {
        setError(`Too many login attempts. Please try again in ${data.retryAfter} seconds.`);
      } else if (response.status === 503) {
        setError('Admin access is not configured. Please contact the administrator.');
      } else {
        setError(data.error || 'Invalid password');
      }
      return false;
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Login error:', err);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout endpoint to invalidate server-side session
      await fetch('/api/admin/auth', {
        method: 'DELETE',
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    }

    // Clear local session regardless of server response
    localStorage.removeItem(ADMIN_SESSION_KEY);
    setSessionToken(null);
    setIsAuthenticated(false);
    setError(null);
  }, [sessionToken]);

  const getAuthHeaders = useCallback((): Record<string, string> => {
    if (!sessionToken) return {};
    return { Authorization: `Bearer ${sessionToken}` };
  }, [sessionToken]);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        login,
        logout,
        getAuthHeaders,
      }}
    >
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
