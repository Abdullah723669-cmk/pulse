import { Response } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    const notifications = await prisma.notification.findMany({
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

    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: req.user.id,
        isRead: false,
      },
    });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Error retrieving notifications.', error: error.message });
  }
};

export const markNotificationsAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated.' });
      return;
    }

    await prisma.notification.updateMany({
      where: {
        recipientId: req.user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({ message: 'Notifications marked as read.' });
  } catch (error: any) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Error updating notifications.', error: error.message });
  }
};
