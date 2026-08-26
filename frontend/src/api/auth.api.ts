import { apiClient } from './client';
import { User } from '../types';

export const authApi = {
  // These MUST throw on failure — no fallback for auth
  login: async (credentials: { loginOrEmail: string; password: string }): Promise<{ message: string; token: string; user: User }> => {
    const res = await apiClient.post<{ message: string; token: string; user: User }>('/api/auth/login', credentials);
    return res.data;
  },

  register: async (data: { email: string; username: string; password: string; name: string; avatar?: string; bio?: string }): Promise<{ message: string; token: string; user: User }> => {
    const res = await apiClient.post<{ message: string; token: string; user: User }>('/api/auth/register', data);
    return res.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/api/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
    const res = await apiClient.put<{ message: string; user: User }>('/api/auth/profile', data);
    return res.data;
  },
};
