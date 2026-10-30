import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { api, getToken, setToken, clearToken, onUnauthorized } from './api';
import type { AdminUser, LoginResponse } from '../types/api';

interface AuthContextType {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: (reason?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [user, setUser] = useState<AdminUser | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem('offscript_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const lastActivityRef = useRef<number>(Date.now());
  const inactivityTimerRef = useRef<any>(null);

  const logout = useCallback((_reason?: string) => {
    clearToken();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('offscript_admin_user');
      } catch {
        // ignore
      }
    }
    setTokenState(null);
    setUser(null);
    if (inactivityTimerRef.current) {
      clearInterval(inactivityTimerRef.current);
    }
  }, []);

  // Listen for 401 events from the api layer
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      logout('unauthorized');
    });
    return unsubscribe;
  }, [logout]);

  // Inactivity tracking (30 minutes)
  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (!token) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const onActivity = () => resetInactivity();

    activityEvents.forEach((ev) => window.addEventListener(ev, onActivity, { passive: true }));

    // Check inactivity every 30 seconds
    inactivityTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        logout('inactivity');
      }
    }, 30000);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, onActivity));
      if (inactivityTimerRef.current) {
        clearInterval(inactivityTimerRef.current);
      }
    };
  }, [token, resetInactivity, logout]);

  // Initial load check
  useEffect(() => {
    const existingToken = getToken();
    if (existingToken) {
      setTokenState(existingToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    const res = await api.post<LoginResponse>('/api/admin/auth/login', { email, password });
    if (res?.token) {
      setToken(res.token);
      setTokenState(res.token);
      const adminUser: AdminUser = res.user || { id: 'admin', email };
      setUser(adminUser);
      try {
        sessionStorage.setItem('offscript_admin_user', JSON.stringify(adminUser));
      } catch {
        // ignore
      }
      lastActivityRef.current = Date.now();
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
