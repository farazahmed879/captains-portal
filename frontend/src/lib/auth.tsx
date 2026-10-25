'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from './api';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'captain' | 'treasurer' | 'viewer' | string;
  tenantId?: string;
  playerId?: string;
  player?: {
    id: string;
    name: string;
    jerseyNumber?: number;
    role?: string;
    battingStyle?: string;
    bowlingStyle?: string;
  };
}

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phoneOrEmail: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { name: string; phone?: string; email?: string; password: string; teamName?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem('cp_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.phone === '0300-1234567' || !parsed.phone) {
            parsed.phone = '0342-2181946';
          }
          return parsed;
        }
      } catch {}
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem('token');
      } catch {}
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('token');
    }
    return false;
  });

  const router = useRouter();

  // Load / verify session from localStorage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('cp_user');

      if (savedToken) {
        setToken(savedToken);
        if (savedUser && !user) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed.phone === '0300-1234567' || !parsed.phone) {
              parsed.phone = '0342-2181946';
            }
            setUser(parsed);
          } catch {}
        }

        // Verify with backend
        fetchApi<{ success: boolean; user: any }>('/auth/me')
          .then((res) => {
            if (res.success && res.user) {
              const u: UserSession = {
                id: res.user._id || res.user.id,
                name: res.user.name,
                email: res.user.email,
                phone: res.user.phone || '0342-2181946',
                role: res.user.role,
                tenantId: res.user.tenantId,
                playerId: res.user.playerId,
                player: res.user.player,
              };
              setUser(u);
              localStorage.setItem('cp_user', JSON.stringify(u));
            }
          })
          .catch(() => {
            // Keep local fallback
          })
          .finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, []);

  const login = async (phoneOrEmail: string, password?: string) => {
    try {
      const res = await fetchApi<{
        success: boolean;
        token?: string;
        user?: any;
        message?: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          phone: phoneOrEmail,
          identifier: phoneOrEmail,
          password: password || undefined,
        }),
      });

      if (res.success && res.token && res.user) {
        const userObj: UserSession = {
          id: res.user.id || res.user._id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          role: res.user.role,
          tenantId: res.user.tenantId,
        };

        setToken(res.token);
        setUser(userObj);
        localStorage.setItem('token', res.token);
        localStorage.setItem('cp_user', JSON.stringify(userObj));
        return { success: true };
      }

      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection error. Please try again.' };
    }
  };

  const registerUser = async (data: { name: string; phone?: string; email?: string; password: string; teamName?: string }) => {
    try {
      const res = await fetchApi<{
        success: boolean;
        token?: string;
        user?: any;
        message?: string;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res.success && res.token && res.user) {
        const userObj: UserSession = {
          id: res.user.id || res.user._id,
          name: res.user.name,
          email: res.user.email,
          phone: res.user.phone,
          role: res.user.role,
          tenantId: res.user.tenantId,
        };

        setToken(res.token);
        setUser(userObj);
        localStorage.setItem('token', res.token);
        localStorage.setItem('cp_user', JSON.stringify(userObj));
        return { success: true };
      }

      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Connection error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cp_user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register: registerUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
