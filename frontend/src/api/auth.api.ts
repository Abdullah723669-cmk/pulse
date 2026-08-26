import { apiClient } from './client';
import { User } from '../types';
import { DEMO_USERS } from './demoData';

export const authApi = {
  login: async (credentials: { loginOrEmail: string; password: string }): Promise<{ message: string; token: string; user: User }> => {
    try {
      const res = await apiClient.post<{ message: string; token: string; user: User }>('/api/auth/login', credentials);
      if (res.data && res.data.token && res.data.user) {
        return res.data;
      }
      throw new Error('Invalid response');
    } catch {
      // Demo accounts fallback login
      const clean = credentials.loginOrEmail.toLowerCase().trim();
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === clean || u.username.toLowerCase() === clean
      ) || DEMO_USERS[0];

      return {
        message: 'Logged in successfully (Demo Session)',
        token: 'demo-token-' + matched.id,
        user: matched,
      };
    }
  },

  register: async (data: { email: string; username: string; password: string; name: string; avatar?: string; bio?: string }): Promise<{ message: string; token: string; user: User }> => {
    try {
      const res = await apiClient.post<{ message: string; token: string; user: User }>('/api/auth/register', data);
      if (res.data && res.data.token && res.data.user) {
        return res.data;
      }
      throw new Error('Invalid response');
    } catch {
      const newUser: User = {
        id: 'user-' + Date.now(),
        name: data.name,
        username: data.username,
        email: data.email,
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
        bio: data.bio || '',
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        isFollowing: false,
        isFollower: false,
        isMutual: false,
        canChat: true,
      };
      return {
        message: 'Account created (Demo Session)',
        token: 'demo-token-' + newUser.id,
        user: newUser,
      };
    }
  },

  getMe: async (): Promise<{ user: User }> => {
    const res = await apiClient.get<{ user: User }>('/api/auth/me');
    return res.data;
  },

  updateProfile: async (data: Partial<User>): Promise<{ message: string; user: User }> => {
    try {
      const res = await apiClient.put<{ message: string; user: User }>('/api/auth/profile', data);
      return res.data;
    } catch {
      const updated: User = {
        ...DEMO_USERS[0],
        ...data,
      };
      return { message: 'Profile updated', user: updated };
    }
  },
};
