import { apiClient } from './client';
import { NotificationItem } from '../types';
import { DEMO_USERS } from './demoData';

const DEMO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    recipientId: 'user-alex',
    actorId: 'user-sarah',
    type: 'LIKE',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    actor: DEMO_USERS[1],
  },
  {
    id: 'n2',
    recipientId: 'user-alex',
    actorId: 'user-david',
    type: 'FOLLOW',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: DEMO_USERS[2],
  },
];

export const notificationApi = {
  getNotifications: async (): Promise<{ notifications: NotificationItem[]; unreadCount: number }> => {
    try {
      const res = await apiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>(
        '/api/notifications'
      );
      if (res.data && Array.isArray(res.data.notifications)) {
        return res.data;
      }
      return { notifications: DEMO_NOTIFICATIONS, unreadCount: 1 };
    } catch {
      return { notifications: DEMO_NOTIFICATIONS, unreadCount: 1 };
    }
  },

  markAsRead: async (): Promise<{ message: string }> => {
    try {
      const res = await apiClient.post<{ message: string }>('/api/notifications/read');
      return res.data;
    } catch {
      return { message: 'Marked read' };
    }
  },
};
