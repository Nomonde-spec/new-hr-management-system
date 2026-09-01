'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: string;
  organization?: any;
  employee?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  switchRoleAccount: (role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.data.success) {
        setUser(res.data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      localStorage.removeItem('hrms_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('hrms_token');
    if (savedToken) {
      setToken(savedToken);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password = 'password123') => {
    try {
      setLoading(true);
      const res = await authApi.login({ email, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem('hrms_token', res.data.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const switchRoleAccount = async (_targetRole: string) => {
    // Demo accounts have been removed. Use the registration page to create your own user account.
    return;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hrms_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, switchRoleAccount, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
