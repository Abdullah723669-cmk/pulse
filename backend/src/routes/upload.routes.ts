import { Router } from 'express';
import { uploadMedia, uploadMultipleMedia } from '../controllers/upload.controller';
import { upload } from '../middleware/upload.middleware';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/single', upload.single('file'), uploadMedia);
router.post('/multiple', upload.array('files', 5), uploadMultipleMedia);

export default router;
