import { apiClient } from './client';
import { User } from '../types';

export const userApi = {
  getProfile: async (username: string) => {
    const res = await apiClient.get<{ user: User }>(`/api/users/profile/${username}`);
    return res.data;
  },

  followUser: async (userId: string) => {
    const res = await apiClient.post<{ message: string; isFollowing: boolean; isMutual: boolean; canChat: boolean }>(
      `/api/users/${userId}/follow`
    );
    return res.data;
  },

  unfollowUser: async (userId: string) => {
    const res = await apiClient.delete<{ message: string; isFollowing: boolean; isMutual: boolean; canChat: boolean }>(
      `/api/users/${userId}/unfollow`
    );
    return res.data;
  },

  getFollowers: async (userId: string) => {
    const res = await apiClient.get<{ followers: User[] }>(`/api/users/${userId}/followers`);
    return res.data;
  },

  getFollowing: async (userId: string) => {
    const res = await apiClient.get<{ following: User[] }>(`/api/users/${userId}/following`);
    return res.data;
  },

  searchUsers: async (query: string) => {
    const res = await apiClient.get<{ users: User[] }>(`/api/users/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  getSuggested: async () => {
    const res = await apiClient.get<{ users: User[] }>('/api/users/suggested');
    return res.data;
  },
};
