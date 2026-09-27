import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch, setToken, clearToken, getToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (roleEmail: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_ACCOUNTS = [
  { role: 'Trader Owner', email: 'trader@metrology.gov.in', pass: 'password123' },
  { role: 'LMO Inspector', email: 'lmo.delhi@metrology.gov.in', pass: 'password123' },
  { role: 'GATC Operator', email: 'gatc.operator@metrology.gov.in', pass: 'password123' },
  { role: 'State Admin', email: 'state.admin@metrology.gov.in', pass: 'password123' },
  { role: 'Central Admin', email: 'admin@metrology.gov.in', pass: 'password123' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiFetch('/auth/me');
        setUser(data.user);
      } catch (err) {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: pass })
      });
      setToken(data.token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const switchDemoRole = async (email: string) => {
    await login(email, 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
