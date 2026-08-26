import { apiClient } from './client';
import { Conversation, Message } from '../types';
import { DEMO_CONVERSATIONS, DEMO_USERS } from './demoData';

export const chatApi = {
  getConversations: async (): Promise<{ conversations: Conversation[] }> => {
    try {
      const res = await apiClient.get<{ conversations: Conversation[] }>('/api/chat/conversations');
      if (res.data && Array.isArray(res.data.conversations)) {
        return res.data;
      }
      return { conversations: DEMO_CONVERSATIONS };
    } catch {
      return { conversations: DEMO_CONVERSATIONS };
    }
  },

  startConversation: async (targetUserId: string): Promise<{ conversation: Conversation }> => {
    try {
      const res = await apiClient.post<{ conversation: Conversation }>('/api/chat/start', {
        targetUserId,
      });
      return res.data;
    } catch {
      const targetUser = DEMO_USERS.find((u) => u.id === targetUserId) || DEMO_USERS[1];
      const conv: Conversation = {
        id: 'conv-' + targetUserId,
        updatedAt: new Date().toISOString(),
        otherUser: targetUser,
        lastMessage: null,
        unreadCount: 0,
        chatPermission: {
          canChat: targetUser.canChat ?? true,
          reason: targetUser.canChat ? undefined : 'Follow this user to unlock chat.',
          isFollowing: targetUser.isFollowing ?? true,
          isFollower: targetUser.isFollower ?? true,
          isMutual: targetUser.isMutual ?? true,
        },
      };
      return { conversation: conv };
    }
  },

  getMessages: async (conversationId: string): Promise<{ messages: Message[] }> => {
    try {
      const res = await apiClient.get<{ messages: Message[] }>(`/api/chat/conversations/${conversationId}/messages`);
      if (res.data && Array.isArray(res.data.messages)) {
        return res.data;
      }
      return {
        messages: [
          {
            id: 'm1',
            conversationId,
            senderId: 'user-sarah',
            text: 'Hey Alex! Loved your latest post on the new real-time architecture 🎉',
            mediaUrl: null,
            mediaType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: 'm2',
            conversationId,
            senderId: 'user-alex',
            text: 'Thanks Sarah! Really appreciate it. How is the new design coming along?',
            mediaUrl: null,
            mediaType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
        ],
      };
    } catch {
      return {
        messages: [
          {
            id: 'm1',
            conversationId,
            senderId: 'user-sarah',
            text: 'Hey! Loved your latest post on the new real-time architecture 🎉',
            mediaUrl: null,
            mediaType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: 'm2',
            conversationId,
            senderId: 'user-alex',
            text: 'Thanks! Really appreciate it. Direct messaging is live!',
            mediaUrl: null,
            mediaType: null,
            isRead: true,
            createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
        ],
      };
    }
  },

  sendMessage: async (
    conversationId: string,
    data: { text?: string; mediaUrl?: string; mediaType?: string }
  ): Promise<{ message: Message }> => {
    try {
      const res = await apiClient.post<{ message: Message }>(
        `/api/chat/conversations/${conversationId}/messages`,
        data
      );
      return res.data;
    } catch {
      const newMsg: Message = {
        id: 'msg-' + Date.now(),
        conversationId,
        senderId: 'user-alex',
        text: data.text || null,
        mediaUrl: data.mediaUrl || null,
        mediaType: (data.mediaType as any) || null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      return { message: newMsg };
    }
  },
};
