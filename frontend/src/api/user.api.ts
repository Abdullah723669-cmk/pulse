import { apiClient } from './client';
import { User } from '../types';
import { DEMO_USERS } from './demoData';

export const userApi = {
  getProfile: async (username: string): Promise<{ user: User }> => {
    try {
      const res = await apiClient.get<{ user: User }>(`/api/users/profile/${username}`);
      if (res.data && res.data.user) {
        return res.data;
      }
      const found = DEMO_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
      if (found) return { user: found };
      return { user: DEMO_USERS[0] };
    } catch {
      const found = DEMO_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
      return { user: found || DEMO_USERS[0] };
    }
  },

  followUser: async (userId: string): Promise<{ message: string; isFollowing: boolean; isMutual: boolean; canChat: boolean }> => {
    try {
      const res = await apiClient.post<{ message: string; isFollowing: boolean; isMutual: boolean; canChat: boolean }>(
        `/api/users/${userId}/follow`
      );
      return res.data;
    } catch {
      return { message: 'Followed user', isFollowing: true, isMutual: true, canChat: true };
    }
  },

  unfollowUser: async (userId: string): Promise<{ message: string; isFollowing: boolean; isMutual: boolean; canChat: boolean }> => {
    try {
      const res = await apiClient.delete<{ message: string; isFollowing: boolean; isMutual: boolean; canChat: boolean }>(
        `/api/users/${userId}/unfollow`
      );
      return res.data;
    } catch {
      return { message: 'Unfollowed user', isFollowing: false, isMutual: false, canChat: false };
    }
  },

  getFollowers: async (userId: string): Promise<{ followers: User[] }> => {
    try {
      const res = await apiClient.get<{ followers: User[] }>(`/api/users/${userId}/followers`);
      if (res.data && Array.isArray(res.data.followers)) {
        return res.data;
      }
      return { followers: DEMO_USERS.slice(0, 2) };
    } catch {
      return { followers: DEMO_USERS.slice(0, 2) };
    }
  },

  getFollowing: async (userId: string): Promise<{ following: User[] }> => {
    try {
      const res = await apiClient.get<{ following: User[] }>(`/api/users/${userId}/following`);
      if (res.data && Array.isArray(res.data.following)) {
        return res.data;
      }
      return { following: DEMO_USERS.slice(1, 3) };
    } catch {
      return { following: DEMO_USERS.slice(1, 3) };
    }
  },

  searchUsers: async (query: string): Promise<{ users: User[] }> => {
    try {
      const res = await apiClient.get<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (res.data && Array.isArray(res.data.users)) {
        return res.data;
      }
      return {
        users: DEMO_USERS.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.username.toLowerCase().includes(query.toLowerCase())
        ),
      };
    } catch {
      return {
        users: DEMO_USERS.filter(
          (u) =>
            u.name.toLowerCase().includes(query.toLowerCase()) ||
            u.username.toLowerCase().includes(query.toLowerCase())
        ),
      };
    }
  },

  getSuggested: async (): Promise<{ users: User[] }> => {
    try {
      const res = await apiClient.get<{ users: User[] }>('/api/users/suggested');
      if (res.data && Array.isArray(res.data.users)) {
        return res.data;
      }
      return { users: DEMO_USERS };
    } catch {
      return { users: DEMO_USERS };
    }
  },
};
