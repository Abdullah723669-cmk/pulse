import { Router } from 'express';
import {
  getFeed,
  getUserPosts,
  createPost,
  likePost,
  getPostComments,
  addComment,
  deletePost,
  searchPosts,
} from '../controllers/post.controller';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/search', optionalAuth, searchPosts);
router.get('/feed', optionalAuth, getFeed);
router.get('/user/:username', optionalAuth, getUserPosts);
router.post('/', authenticateJWT, createPost);
router.post('/:id/like', authenticateJWT, likePost);
router.get('/:id/comments', optionalAuth, getPostComments);
router.post('/:id/comments', authenticateJWT, addComment);
router.delete('/:id', authenticateJWT, deletePost);

export default router;
