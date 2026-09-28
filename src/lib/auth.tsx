'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LoginRequest, RegisterRequest, UserDto } from './types';
import {
  authApi,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from './api';

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Rehydrate from localStorage on client mount
    const savedToken = getStoredToken();
    const savedUser = getStoredUser();

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(savedUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.authResponse?.token && res.user) {
        setToken(res.authResponse.token);
        setUser(res.user);
        setStoredToken(res.authResponse.token);
        setStoredUser(res.user);
      } else {
        throw new Error(res.message || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.authResponse?.token && res.user) {
        setToken(res.authResponse.token);
        setUser(res.user);
        setStoredToken(res.authResponse.token);
        setStoredUser(res.user);
      } else {
        throw new Error(res.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setStoredToken(null);
    setStoredUser(null);
  }, []);

  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
