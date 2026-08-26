"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessage = exports.getMessages = exports.startOrGetConversation = exports.getConversations = exports.checkCanChat = void 0;
const prisma_1 = require("../config/prisma");
const checkCanChat = async (userAId, userBId) => {
    if (userAId === userBId) {
        return {
            canChat: false,
            reason: 'Cannot chat with yourself.',
            isFollowing: false,
            isFollower: false,
            isMutual: false,
        };
    }
    const follows = await prisma_1.prisma.follow.findMany({
        where: {
            OR: [
                { followerId: userAId, followingId: userBId }, // userA follows userB
                { followerId: userBId, followingId: userAId }, // userB follows userA
            ],
        },
    });
    const isFollowing = follows.some((f) => f.followerId === userAId && f.followingId === userBId);
    const isFollower = follows.some((f) => f.followerId === userBId && f.followingId === userAId);
    const isMutual = isFollowing && isFollower;
    // Follower condition: A follow relationship must exist
    const canChat = isFollowing || isFollower;
    return {
        canChat,
        reason: canChat ? undefined : 'Direct messaging is only allowed between followers. Follow this user to start chatting!',
        isFollowing,
        isFollower,
        isMutual,
    };
};
exports.checkCanChat = checkCanChat;
const getConversations = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const currentUserId = req.user.id;
        const userConversations = await prisma_1.prisma.conversationParticipant.findMany({
            where: { userId: currentUserId },
            include: {
                conversation: {
                    include: {
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        username: true,
                                        avatar: true,
                                        isVerified: true,
                                    },
                                },
                            },
                        },
                        messages: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                            include: {
                                sender: {
                                    select: { id: true, name: true, username: true },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { conversation: { updatedAt: 'desc' } },
        });
        const formatted = await Promise.all(userConversations.map(async (cp) => {
            const conv = cp.conversation;
            const otherParticipant = conv.participants.find((p) => p.userId !== currentUserId);
            const lastMsg = conv.messages[0] || null;
            // Unread messages count
            const unreadCount = await prisma_1.prisma.message.count({
                where: {
                    conversationId: conv.id,
                    senderId: { not: currentUserId },
                    createdAt: { gt: cp.lastReadAt },
                },
            });
            let chatPermission = { canChat: true, isFollowing: true, isFollower: true, isMutual: true };
            if (otherParticipant) {
                chatPermission = await (0, exports.checkCanChat)(currentUserId, otherParticipant.userId);
            }
            return {
                id: conv.id,
                updatedAt: conv.updatedAt,
                otherUser: otherParticipant?.user || null,
                lastMessage: lastMsg
                    ? {
                        id: lastMsg.id,
                        text: lastMsg.text,
                        mediaUrl: lastMsg.mediaUrl,
                        mediaType: lastMsg.mediaType,
                        createdAt: lastMsg.createdAt,
                        senderId: lastMsg.senderId,
                        isRead: lastMsg.isRead,
                    }
                    : null,
                unreadCount,
                chatPermission,
            };
        }));
        res.json({ conversations: formatted });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Error retrieving conversations.', error: error.message });
    }
};
exports.getConversations = getConversations;
const startOrGetConversation = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const { targetUserId } = req.body;
        const currentUserId = req.user.id;
        if (!targetUserId) {
            res.status(400).json({ message: 'Target user ID is required.' });
            return;
        }
        const targetUser = await prisma_1.prisma.user.findUnique({
            where: { id: targetUserId },
            select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                isVerified: true,
            },
        });
        if (!targetUser) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }
        // Check follower permission!
        const permission = await (0, exports.checkCanChat)(currentUserId, targetUserId);
        // Look for existing conversation
        const existing = await prisma_1.prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { userId: currentUserId } } },
                    { participants: { some: { userId: targetUserId } } },
                ],
            },
            include: {
                participants: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                username: true,
                                avatar: true,
                                isVerified: true,
                            },
                        },
                    },
                },
            },
        });
        if (existing) {
            res.json({
                conversation: {
                    id: existing.id,
                    otherUser: targetUser,
                    chatPermission: permission,
                },
            });
            return;
        }
        // Create new conversation
        const newConv = await prisma_1.prisma.conversation.create({
            data: {
                participants: {
                    create: [{ userId: currentUserId }, { userId: targetUserId }],
                },
            },
        });
        res.status(201).json({
            conversation: {
                id: newConv.id,
                otherUser: targetUser,
                chatPermission: permission,
            },
        });
    }
    catch (error) {
        console.error('Start conversation error:', error);
        res.status(500).json({ message: 'Error initiating conversation.', error: error.message });
    }
};
exports.startOrGetConversation = startOrGetConversation;
const getMessages = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const { id: conversationId } = req.params;
        const currentUserId = req.user.id;
        // Verify participant
        const participant = await prisma_1.prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: currentUserId,
                },
            },
        });
        if (!participant) {
            res.status(403).json({ message: 'You are not a participant in this conversation.' });
            return;
        }
        // Mark messages as read & update lastReadAt
        await prisma_1.prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { lastReadAt: new Date() },
        });
        await prisma_1.prisma.message.updateMany({
            where: {
                conversationId,
                senderId: { not: currentUserId },
                isRead: false,
            },
            data: { isRead: true },
        });
        const messages = await prisma_1.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            take: 100,
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
        res.json({ messages });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Error retrieving messages.', error: error.message });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const { id: conversationId } = req.params;
        const { text, mediaUrl, mediaType } = req.body;
        const currentUserId = req.user.id;
        if (!text?.trim() && !mediaUrl) {
            res.status(400).json({ message: 'Message text or media is required.' });
            return;
        }
        // Get conversation participants
        const participants = await prisma_1.prisma.conversationParticipant.findMany({
            where: { conversationId },
            include: { user: true },
        });
        const isMember = participants.some((p) => p.userId === currentUserId);
        if (!isMember) {
            res.status(403).json({ message: 'You are not a participant in this conversation.' });
            return;
        }
        const otherParticipant = participants.find((p) => p.userId !== currentUserId);
        if (otherParticipant) {
            // Follower-gating restriction check!
            const permission = await (0, exports.checkCanChat)(currentUserId, otherParticipant.userId);
            if (!permission.canChat) {
                res.status(403).json({
                    message: 'Permission denied. You can only chat with users who follow you or who you follow.',
                    requiresFollow: true,
                });
                return;
            }
        }
        // Create message
        const message = await prisma_1.prisma.message.create({
            data: {
                conversationId,
                senderId: currentUserId,
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
        // Update conversation updatedAt
        await prisma_1.prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() },
        });
        // Update sender's lastReadAt
        await prisma_1.prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId: currentUserId,
                },
            },
            data: { lastReadAt: new Date() },
        });
        res.status(201).json({ message });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Error sending message.', error: error.message });
    }
};
exports.sendMessage = sendMessage;
