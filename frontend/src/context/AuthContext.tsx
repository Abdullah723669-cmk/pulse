import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authApi } from '../api/auth.api';
import { DEMO_USERS } from '../api/demoData';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { loginOrEmail: string; password: string }) => Promise<void>;
  register: (data: { email: string; username: string; password: string; name: string; avatar?: string; bio?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pulse_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('pulse_token');
      if (storedToken) {
        if (storedToken.startsWith('demo-token-')) {
          const userId = storedToken.replace('demo-token-', '');
          const matched = DEMO_USERS.find((u) => u.id === userId) || DEMO_USERS[0];
          setUser(matched);
        } else {
          try {
            const data = await authApi.getMe();
            if (data && data.user) {
              setUser(data.user);
            }
          } catch (err) {
            console.error('Session restoration failed:', err);
            localStorage.removeItem('pulse_token');
            setToken(null);
            setUser(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: { loginOrEmail: string; password: string }) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('pulse_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const register = async (data: { email: string; username: string; password: string; name: string; avatar?: string; bio?: string }) => {
    const res = await authApi.register(data);
    localStorage.setItem('pulse_token', res.token);
    setToken(res.token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem('pulse_token');
    setToken(null);
    setUser(null);
  };

  const updateUser = async (data: Partial<User>) => {
    const res = await authApi.updateProfile(data);
    if (res && res.user) {
      setUser(res.user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
