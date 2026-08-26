import { apiClient } from './client';
import { NotificationItem } from '../types';

export const notificationApi = {
  getNotifications: async () => {
    const res = await apiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>(
      '/api/notifications'
    );
    return res.data;
  },

  markAsRead: async () => {
    const res = await apiClient.post<{ message: string }>('/api/notifications/read');
    return res.data;
  },
};
