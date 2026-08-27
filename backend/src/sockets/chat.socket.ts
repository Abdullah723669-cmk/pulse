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

// Track active calls: userId -> { callId: string, peerId: string, callType: 'audio' | 'video', startedAt: number }
const activeCalls = new Map<string, { callId: string; peerId: string; callType: 'audio' | 'video'; startedAt: number }>();

// Auto-cleanup stale calls older than 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, call] of activeCalls.entries()) {
    if (now - call.startedAt > 5 * 60 * 1000) {
      activeCalls.delete(userId);
    }
  }
}, 60 * 1000);

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

    // Join personal room for private notifications & WebRTC signaling
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

    // ==========================================
    // WebRTC 1-on-1 Audio & Video Call Signaling
    // ==========================================

    // Initiate Call (Offer)
    socket.on('call_user', async (data: {
      targetUserId: string;
      offer: any;
      callType: 'audio' | 'video';
      callId: string;
    }) => {
      try {
        const { targetUserId, offer, callType, callId } = data;

        if (!targetUserId || !offer) {
          socket.emit('call_failed', { callId, reason: 'Invalid call request parameters.' });
          return;
        }

        // Check follower permission
        const permission = await checkCanChat(userId, targetUserId);
        if (!permission.canChat) {
          socket.emit('call_failed', {
            callId,
            reason: 'Cannot call this user due to follower restrictions.',
          });
          return;
        }

        // Check if recipient is online
        const isOnline = onlineUsers.has(targetUserId) && (onlineUsers.get(targetUserId)?.size ?? 0) > 0;
        if (!isOnline) {
          socket.emit('call_failed', {
            callId,
            reason: 'Recipient is currently offline.',
          });
          return;
        }

        // Reset any existing stale call for caller
        activeCalls.delete(userId);

        // Register active call for caller
        activeCalls.set(userId, { callId, peerId: targetUserId, callType, startedAt: Date.now() });

        // Forward incoming call offer to recipient's room
        io.to(`user:${targetUserId}`).emit('incoming_call', {
          callId,
          fromUser: socket.user,
          offer,
          callType,
        });
      } catch (err: any) {
        console.error('Socket call_user error:', err);
        socket.emit('call_failed', { callId: data.callId, reason: 'Failed to initiate call.' });
      }
    });

    // Answer Call (Answer)
    socket.on('answer_call', (data: {
      toUserId: string;
      answer: any;
      callId: string;
    }) => {
      try {
        const { toUserId, answer, callId } = data;
        const callerCall = activeCalls.get(toUserId);
        const callType = callerCall ? callerCall.callType : 'audio';

        // Register active call for callee
        activeCalls.set(userId, { callId, peerId: toUserId, callType, startedAt: Date.now() });

        // Forward answer to caller's room
        io.to(`user:${toUserId}`).emit('call_answered', {
          callId,
          answer,
          fromUser: socket.user,
        });
      } catch (err) {
        console.error('Socket answer_call error:', err);
      }
    });

    // Reject / Decline Call
    socket.on('reject_call', (data: {
      toUserId: string;
      callId: string;
      reason?: string;
    }) => {
      try {
        const { toUserId, callId, reason } = data;
        activeCalls.delete(toUserId);
        activeCalls.delete(userId);

        io.to(`user:${toUserId}`).emit('call_rejected', {
          callId,
          reason: reason || 'Call was declined.',
        });
      } catch (err) {
        console.error('Socket reject_call error:', err);
      }
    });

    // ICE Candidate Exchange
    socket.on('ice_candidate', (data: {
      targetUserId: string;
      candidate: any;
      callId: string;
    }) => {
      try {
        const { targetUserId, candidate, callId } = data;
        io.to(`user:${targetUserId}`).emit('ice_candidate', {
          candidate,
          callId,
          fromUserId: userId,
        });
      } catch (err) {
        console.error('Socket ice_candidate error:', err);
      }
    });

    // End Call
    socket.on('end_call', (data: {
      targetUserId: string;
      callId: string;
    }) => {
      try {
        const { targetUserId, callId } = data;
        activeCalls.delete(userId);
        activeCalls.delete(targetUserId);

        io.to(`user:${targetUserId}`).emit('call_ended', {
          callId,
          reason: 'Call ended.',
        });
        socket.emit('call_ended', {
          callId,
          reason: 'Call ended.',
        });
      } catch (err) {
        console.error('Socket end_call error:', err);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      // If user was in an active call, notify the other party
      const currentCall = activeCalls.get(userId);
      if (currentCall) {
        io.to(`user:${currentCall.peerId}`).emit('call_ended', {
          callId: currentCall.callId,
          reason: 'User disconnected.',
        });
        activeCalls.delete(userId);
        activeCalls.delete(currentCall.peerId);
      }

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
