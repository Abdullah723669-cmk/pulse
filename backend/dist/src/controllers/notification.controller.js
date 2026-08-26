"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNotificationsAsRead = exports.getNotifications = void 0;
const prisma_1 = require("../config/prisma");
const getNotifications = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { recipientId: req.user.id },
            orderBy: { createdAt: 'desc' },
            take: 30,
            include: {
                actor: {
                    select: {
                        id: true,
                        name: true,
                        username: true,
                        avatar: true,
                        isVerified: true,
                    },
                },
            },
        });
        const unreadCount = await prisma_1.prisma.notification.count({
            where: {
                recipientId: req.user.id,
                isRead: false,
            },
        });
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Error retrieving notifications.', error: error.message });
    }
};
exports.getNotifications = getNotifications;
const markNotificationsAsRead = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }
        await prisma_1.prisma.notification.updateMany({
            where: {
                recipientId: req.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });
        res.json({ message: 'Notifications marked as read.' });
    }
    catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'Error updating notifications.', error: error.message });
    }
};
exports.markNotificationsAsRead = markNotificationsAsRead;
