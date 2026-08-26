import { Router } from 'express';
import { register, login, getMe, updateProfile } from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateJWT, getMe);
router.put('/profile', authenticateJWT, updateProfile);

export default router;
