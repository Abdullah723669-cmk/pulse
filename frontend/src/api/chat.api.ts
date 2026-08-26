import { apiClient } from './client';
import { Conversation, Message } from '../types';
import { DEMO_CONVERSATIONS } from './demoData';

export const chatApi = {
  getConversations: async (): Promise<{ conversations: Conversation[] }> => {
    try {
      const res = await apiClient.get<{ conversations: Conversation[] }>('/api/chat/conversations');
      if (res.data && Array.isArray(res.data.conversations)) return res.data;
      return { conversations: DEMO_CONVERSATIONS };
    } catch {
      return { conversations: DEMO_CONVERSATIONS };
    }
  },

  // WRITES — must persist
  startConversation: async (targetUserId: string): Promise<{ conversation: Conversation }> => {
    const res = await apiClient.post<{ conversation: Conversation }>('/api/chat/start', { targetUserId });
    return res.data;
  },

  getMessages: async (conversationId: string): Promise<{ messages: Message[] }> => {
    try {
      const res = await apiClient.get<{ messages: Message[] }>(`/api/chat/conversations/${conversationId}/messages`);
      if (res.data && Array.isArray(res.data.messages)) return res.data;
      return { messages: [] };
    } catch {
      return { messages: [] };
    }
  },

  // WRITES — must persist
  sendMessage: async (
    conversationId: string,
    data: { text?: string; mediaUrl?: string; mediaType?: string }
  ): Promise<{ message: Message }> => {
    const res = await apiClient.post<{ message: Message }>(
      `/api/chat/conversations/${conversationId}/messages`,
      data
    );
    return res.data;
  },
};
