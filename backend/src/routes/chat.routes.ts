import { Router } from 'express';
import {
  getConversations,
  startOrGetConversation,
  getMessages,
  sendMessage,
} from '../controllers/chat.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.get('/conversations', getConversations);
router.post('/start', startOrGetConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
