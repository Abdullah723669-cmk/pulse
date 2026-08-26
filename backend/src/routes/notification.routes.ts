import { Router } from 'express';
import { getNotifications, markNotificationsAsRead } from '../controllers/notification.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/', getNotifications);
router.post('/read', markNotificationsAsRead);

export default router;
