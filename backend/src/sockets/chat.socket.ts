import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { prisma } from '../config/prisma';
import { checkCanChat } from '../controllers/chat.controller';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
}

// Track online users: userId -> Set of socket IDs
const onlineUsers = new Map<string, Set<string>>();

export const setupChatSocket = (io: SocketIOServer) => {
  // Authentication middleware for Socket.io
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (socket.handshake.query?.token as string);

      if (!token) {
        return next(new Error('Authentication token required.'));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
        },
      });

      if (!user) {
        return next(new Error('User not found.'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (err) {
      return next(new Error('Invalid token authentication.'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (!userId || !socket.user) return;

    // Track online user
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    // Join personal room for private notifications
    socket.join(`user:${userId}`);

    // Broadcast user online status
    io.emit('user_status_change', {
      userId,
      status: 'online',
      onlineUserIds: Array.from(onlineUsers.keys()),
    });

    // Provide initial list of online users
    socket.emit('online_users_list', Array.from(onlineUsers.keys()));

    // Join Conversation Room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave Conversation Room
    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Handle Real-Time Message Sending
    socket.on('send_message', async (data: {
      conversationId: string;
      text?: string;
      mediaUrl?: string;
      mediaType?: string;
    }) => {
      try {
        const { conversationId, text, mediaUrl, mediaType } = data;

        if (!text?.trim() && !mediaUrl) {
          socket.emit('error_message', { message: 'Message content is required.' });
          return;
        }

        // Fetch participants
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId },
        });

        const isMember = participants.some((p) => p.userId === userId);
        if (!isMember) {
          socket.emit('error_message', { message: 'Unauthorized conversation participant.' });
          return;
        }

        const recipient = participants.find((p) => p.userId !== userId);

        if (recipient) {
          // Verify follower restriction
          const permission = await checkCanChat(userId, recipient.userId);
          if (!permission.canChat) {
            socket.emit('error_message', {
              message: 'Follower restriction: You can only chat with users you follow or who follow you.',
              requiresFollow: true,
            });
            return;
          }
        }

        // Save message
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            text: text ? text.trim() : null,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              },
            },
          },
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Broadcast to conversation room
        io.to(`conversation:${conversationId}`).emit('new_message', {
          conversationId,
          message,
        });

        // Send push notification event to recipient's personal room
        if (recipient) {
          io.to(`user:${recipient.userId}`).emit('message_notification', {
            conversationId,
            message,
            sender: socket.user,
          });
        }
      } catch (err: any) {
        console.error('Socket send_message error:', err);
        socket.emit('error_message', { message: 'Failed to deliver message.' });
      }
    });

    // Real-Time Typing Indicator
    socket.on('typing_start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        user: socket.user,
      });
    });

    socket.on('typing_stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
      });
    });

    // Read Receipt
    socket.on('mark_read', async (data: { conversationId: string }) => {
      try {
        const { conversationId } = data;
        await prisma.message.updateMany({
          where: {
            conversationId,
            senderId: { not: userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        socket.to(`conversation:${conversationId}`).emit('messages_marked_read', {
          conversationId,
          readerId: userId,
        });
      } catch (err) {
        console.error('Socket mark_read error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status_change', {
            userId,
            status: 'offline',
            onlineUserIds: Array.from(onlineUsers.keys()),
          });
        }
      }
    });
  });
};
