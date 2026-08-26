import { Router } from 'express';
import {
  getUserProfile,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  searchUsers,
  getSuggestedUsers,
} from '../controllers/user.controller';
import { authenticateJWT, optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/search', optionalAuth, searchUsers);
router.get('/suggested', optionalAuth, getSuggestedUsers);
router.get('/profile/:username', optionalAuth, getUserProfile);
router.post('/:id/follow', authenticateJWT, followUser);
router.delete('/:id/unfollow', authenticateJWT, unfollowUser);
router.get('/:id/followers', optionalAuth, getFollowers);
router.get('/:id/following', optionalAuth, getFollowing);

export default router;
