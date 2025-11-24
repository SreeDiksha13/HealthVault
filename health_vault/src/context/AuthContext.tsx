"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as authApi from '@/lib/auth';

type User = {
  email: string;
  full_name?: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = localStorage.getItem('hv_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('hv_token');
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user) localStorage.setItem('hv_user', JSON.stringify(user));
    else localStorage.removeItem('hv_user');
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (token) localStorage.setItem('hv_token', token);
    else localStorage.removeItem('hv_token');
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setToken(res.accessToken);
    setUser(res.user);
  };

  const register = async (email: string, password: string, full_name?: string) => {
    const res = await authApi.register(email, password, full_name);
    // If register returns accessToken (OTP-flow or auto-verify), use it
    if (res.accessToken) {
      setToken(res.accessToken);
      setUser(res.user || null);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    try { fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {};
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
