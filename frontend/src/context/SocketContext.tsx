import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../api/client';

interface SocketContextType {
  socket: Socket | null;
  onlineUserIds: string[];
  isUserOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUserIds([]);
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      // connected
    });

    newSocket.on('online_users_list', (users: string[]) => {
      setOnlineUserIds(users);
    });

    newSocket.on('user_status_change', (data: { userId: string; status: 'online' | 'offline'; onlineUserIds: string[] }) => {
      setOnlineUserIds(data.onlineUserIds);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const isUserOnline = (userId: string) => {
    return onlineUserIds.includes(userId);
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUserIds, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
