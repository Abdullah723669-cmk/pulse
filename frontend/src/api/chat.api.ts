import { apiClient } from './client';
import { Conversation, Message } from '../types';

export const chatApi = {
  getConversations: async () => {
    const res = await apiClient.get<{ conversations: Conversation[] }>('/api/chat/conversations');
    return res.data;
  },

  startConversation: async (targetUserId: string) => {
    const res = await apiClient.post<{ conversation: Conversation }>('/api/chat/start', {
      targetUserId,
    });
    return res.data;
  },

  getMessages: async (conversationId: string) => {
    const res = await apiClient.get<{ messages: Message[] }>(`/api/chat/conversations/${conversationId}/messages`);
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    data: { text?: string; mediaUrl?: string; mediaType?: string }
  ) => {
    const res = await apiClient.post<{ message: Message }>(
      `/api/chat/conversations/${conversationId}/messages`,
      data
    );
    return res.data;
  },
};
