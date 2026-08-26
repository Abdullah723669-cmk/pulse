import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Conversation, Message } from '../types';
import { chatApi } from '../api/chat.api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  typingUsers: { id: string; name: string; username: string }[];
  setActiveConversation: (conv: Conversation | null) => void;
  loadConversations: () => Promise<void>;
  openChatWithUser: (targetUserId: string) => Promise<Conversation | null>;
  sendMessage: (text?: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'file') => Promise<void>;
  sendTypingStart: () => void;
  sendTypingStop: () => void;
  totalUnreadCount: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; username: string }[]>([]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingConversations(true);
      const data = await chatApi.getConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user]);

  // Load conversations on mount / auth change
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (!activeConversation) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      try {
        setIsLoadingMessages(true);
        const data = await chatApi.getMessages(activeConversation.id);
        setMessages(data.messages);

        // Clear unread count locally
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c))
        );

        if (socket) {
          socket.emit('join_conversation', activeConversation.id);
          socket.emit('mark_read', { conversationId: activeConversation.id });
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    fetchMessages();

    return () => {
      if (socket && activeConversation) {
        socket.emit('leave_conversation', activeConversation.id);
      }
    };
  }, [activeConversation?.id, socket]);

  // Socket event listeners for real-time messages & typing
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: { conversationId: string; message: Message }) => {
      if (activeConversation && activeConversation.id === data.conversationId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
        socket.emit('mark_read', { conversationId: data.conversationId });
      }

      // Update conversation last message & unread count in sidebar
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === data.conversationId);
        if (index === -1) {
          loadConversations();
          return prev;
        }
        const updated = [...prev];
        const conv = updated[index];
        const isCurrentActive = activeConversation?.id === data.conversationId;

        updated[index] = {
          ...conv,
          lastMessage: {
            id: data.message.id,
            text: data.message.text,
            mediaUrl: data.message.mediaUrl,
            mediaType: data.message.mediaType,
            createdAt: data.message.createdAt,
            senderId: data.message.senderId,
            isRead: isCurrentActive,
          },
          unreadCount: isCurrentActive ? 0 : conv.unreadCount + (data.message.senderId !== user?.id ? 1 : 0),
          updatedAt: new Date().toISOString(),
        };

        // Move active conversation to top of list
        const [moved] = updated.splice(index, 1);
        return [moved, ...updated];
      });
    };

    const handleUserTyping = (data: { conversationId: string; user: { id: string; name: string; username: string } }) => {
      if (activeConversation?.id === data.conversationId) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.id === data.user.id)) return prev;
          return [...prev, data.user];
        });
      }
    };

    const handleUserStopTyping = (data: { conversationId: string; userId: string }) => {
      if (activeConversation?.id === data.conversationId) {
        setTypingUsers((prev) => prev.filter((u) => u.id !== data.userId));
      }
    };

    const handleMessagesMarkedRead = (data: { conversationId: string; readerId: string }) => {
      if (activeConversation?.id === data.conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId !== data.readerId ? { ...m, isRead: true } : m))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_marked_read', handleMessagesMarkedRead);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_marked_read', handleMessagesMarkedRead);
    };
  }, [socket, activeConversation?.id, user?.id, loadConversations]);

  const openChatWithUser = async (targetUserId: string): Promise<Conversation | null> => {
    try {
      const data = await chatApi.startConversation(targetUserId);
      const conv = data.conversation;

      // Update conversations list if not present
      setConversations((prev) => {
        if (!prev.some((c) => c.id === conv.id)) {
          return [conv, ...prev];
        }
        return prev;
      });

      setActiveConversation(conv);
      return conv;
    } catch (err: any) {
      console.error('Error starting conversation:', err);
      throw err;
    }
  };

  const sendMessage = async (
    text?: string,
    mediaUrl?: string,
    mediaType?: 'image' | 'video' | 'file'
  ) => {
    if (!activeConversation) return;

    if (socket && socket.connected) {
      socket.emit('send_message', {
        conversationId: activeConversation.id,
        text,
        mediaUrl,
        mediaType,
      });
      socket.emit('typing_stop', activeConversation.id);
    } else {
      // Fallback to REST API
      const res = await chatApi.sendMessage(activeConversation.id, {
        text,
        mediaUrl,
        mediaType,
      });
      setMessages((prev) => [...prev, res.message]);
    }
  };

  const sendTypingStart = () => {
    if (socket && activeConversation) {
      socket.emit('typing_start', activeConversation.id);
    }
  };

  const sendTypingStop = () => {
    if (socket && activeConversation) {
      socket.emit('typing_stop', activeConversation.id);
    }
  };

  const totalUnreadCount = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        typingUsers,
        setActiveConversation,
        loadConversations,
        openChatWithUser,
        sendMessage,
        sendTypingStart,
        sendTypingStop,
        totalUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
